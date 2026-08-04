'use strict';

const db = require('../config/db');
const { writeAudit } = require('./auditLog');

const TYPE_RDV = ['orientation', 'inscription', 'suivi', 'renseignements', 'autre'];
const CRENEAUX = ['matin', 'apres_midi', 'flexible'];

function validateRendezVousBody(body) {
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
  if (!TYPE_RDV.includes(b.type_rdv)) errors.push('Type de rendez-vous invalide');
  const dateRaw = b.date_souhaitee;
  const dateStr = typeof dateRaw === 'string' ? dateRaw.slice(0, 10) : '';
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) errors.push('Date invalide');
  if (!CRENEAUX.includes(b.creneau)) errors.push('Créneau invalide');
  const message = b.message != null ? String(b.message).trim().slice(0, 4000) : null;
  const allowed = ['nom', 'prenom', 'email', 'telephone', 'pays_bureau', 'type_rdv', 'date_souhaitee', 'creneau', 'message'];
  if (Object.keys(b).some((k) => !allowed.includes(k))) errors.push('Champs non autorisés.');
  if (!errors.length && dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) errors.push('La date souhaitée doit être aujourd’hui ou dans le futur.');
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    if (d > max) errors.push('La date ne peut pas dépasser 6 mois.');
  }
  if (errors.length) return { error: errors[0] };
  return {
    data: {
      nom, prenom, email, telephone: tel, pays_bureau: b.pays_bureau,
      type_rdv: b.type_rdv, date_souhaitee: dateStr, creneau: b.creneau, message,
    },
  };
}

async function createRendezVous(body) {
  const v = validateRendezVousBody(body);
  if (v.error) return { status: 400, body: { error: v.error } };
  const d = v.data;
  try {
    await db.query(
      `INSERT INTO rendez_vous (nom, prenom, email, telephone, pays_bureau, type_rdv, date_souhaitee, creneau, message, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'nouveau')`,
      [d.nom, d.prenom, d.email, d.telephone, d.pays_bureau, d.type_rdv, d.date_souhaitee, d.creneau, d.message || null]
    );
  } catch (err) {
    if (String(err.message || '').includes('no such table') || String(err.code) === 'ER_NO_SUCH_TABLE') {
      return { status: 503, body: { error: 'Service temporairement indisponible. Réessayez plus tard.' } };
    }
    throw err;
  }
  const { notifyNewRendezVous } = require('./notifications');
  notifyNewRendezVous(d).catch((e) => console.error('Notification RDV:', e.message));
  writeAudit('rendez_vous.created', { email: d.email, pays_bureau: d.pays_bureau, type_rdv: d.type_rdv, date_souhaitee: d.date_souhaitee });
  return {
    status: 201,
    body: { message: 'Votre demande de rendez-vous a bien été enregistrée. Nous vous recontacterons rapidement.' },
  };
}

module.exports = { createRendezVous };
