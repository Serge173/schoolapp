'use strict';

const db = require('../config/db');
const { writeAudit } = require('./auditLog');

function validateDemandeOrientationBody(body) {
  const b = body || {};
  const errors = [];
  const nom = String(b.nom || '').trim();
  const prenom = String(b.prenom || '').trim();
  if (!nom || nom.length > 100) errors.push('Nom invalide');
  if (!prenom || prenom.length > 100) errors.push('Prénom invalide');
  const email = String(b.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide');
  const tel = String(b.telephone || '').trim();
  if (!tel || tel.length > 40) errors.push('Téléphone invalide');
  if (!['CI', 'BF'].includes(b.pays_bureau)) errors.push('Bureau invalide');
  const grandeFiliere = String(b.grande_filiere || '').trim();
  const specialite = String(b.specialite || '').trim();
  if (!grandeFiliere || grandeFiliere.length > 200) errors.push('Grande filière requise');
  if (!specialite || specialite.length > 400) errors.push('Spécialité requise');
  if (typeof b.besoin_orientation !== 'boolean') errors.push('Besoin orientation invalide');
  const message = b.message != null ? String(b.message).trim().slice(0, 4000) : null;
  const allowed = ['nom', 'prenom', 'email', 'telephone', 'pays_bureau', 'grande_filiere', 'specialite', 'besoin_orientation', 'message'];
  if (Object.keys(b).some((k) => !allowed.includes(k))) errors.push('Champs non autorisés.');
  if (errors.length) return { error: errors[0] };
  return {
    data: {
      nom, prenom, email, telephone: tel, pays_bureau: b.pays_bureau,
      grande_filiere: grandeFiliere, specialite, besoin_orientation: b.besoin_orientation, message,
    },
  };
}

async function createDemandeOrientation(body) {
  const v = validateDemandeOrientationBody(body);
  if (v.error) return { status: 400, body: { error: v.error } };
  const d = v.data;
  const besoin = d.besoin_orientation ? 1 : 0;
  try {
    await db.query(
      `INSERT INTO demandes_orientation (
        nom, prenom, email, telephone, pays_bureau,
        grande_filiere, specialite, besoin_orientation, message, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'nouveau')`,
      [d.nom, d.prenom, d.email, d.telephone, d.pays_bureau, d.grande_filiere, d.specialite, besoin, d.message || null]
    );
  } catch (err) {
    if (String(err.message || '').includes('no such table') || String(err.code) === 'ER_NO_SUCH_TABLE') {
      return { status: 503, body: { error: 'Service temporairement indisponible. Réessayez plus tard.' } };
    }
    throw err;
  }
  const { notifyNewDemandeOrientation } = require('./notifications');
  notifyNewDemandeOrientation({
    nom: d.nom,
    prenom: d.prenom,
    email: d.email,
    telephone: d.telephone,
    pays_bureau: d.pays_bureau,
    grande_filiere: d.grande_filiere,
    specialite: d.specialite,
    besoin_orientation: Boolean(besoin),
    message: d.message || null,
  }).catch((e) => console.error('Notification demande orientation:', e.message));
  writeAudit('demande_orientation.created', { email: d.email, pays_bureau: d.pays_bureau, grande_filiere: d.grande_filiere, specialite: d.specialite });
  return {
    status: 201,
    body: {
      message:
        'Votre demande a bien été enregistrée. Notre équipe vous recontactera (e-mail / téléphone / WhatsApp selon vos coordonnées). Vous pouvez aussi prendre rendez-vous pour poursuivre votre parcours.',
    },
  };
}

module.exports = { createDemandeOrientation };
