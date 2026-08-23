'use strict';

const db = require('../config/db');
const { writeAudit } = require('./auditLog');

function validateInscriptionBody(body) {
  const b = body || {};
  const errors = [];
  const nom = String(b.nom || '').trim();
  const prenom = String(b.prenom || '').trim();
  if (!nom || nom.length > 100) errors.push('Le nom est requis');
  if (!prenom || prenom.length > 100) errors.push('Le prénom est requis');
  if (!b.date_naissance || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.date_naissance).slice(0, 10))) {
    errors.push('Date de naissance invalide');
  }
  if (!['M', 'F'].includes(b.sexe)) errors.push('Sexe invalide');
  const tel = String(b.telephone || '').trim();
  if (!tel || tel.length > 20) errors.push('Le téléphone est requis');
  const email = String(b.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide');
  const ville = String(b.ville || '').trim();
  if (!ville || ville.length > 100) errors.push('La ville est requise');
  const filiereId = b.filiere_id != null && String(b.filiere_id).trim() !== '' ? Number(b.filiere_id) : null;
  const filiereAutre = String(b.filiere_autre || '').trim();
  if (!filiereId && !filiereAutre) errors.push('Filière requise');
  if (filiereAutre && filiereAutre.length > 150) errors.push('Filière autre invalide');
  const universiteId = Number(b.universite_id);
  if (!Number.isInteger(universiteId) || universiteId < 1) errors.push('Université requise');
  if (!['publique', 'privee'].includes(b.type_universite)) errors.push('Type université invalide');
  if (!['CI', 'BF'].includes(b.pays_bureau)) errors.push('Bureau d’origine invalide (CI ou BF).');
  const contact = String(b.contact || '').trim();
  const contactTelephone = String(b.contact_telephone || '').trim();
  if (contact && contact.length > 120) errors.push('Nom du contact trop long');
  if (contactTelephone && contactTelephone.length > 20) errors.push('Téléphone du contact invalide');
  const allowed = [
    'nom', 'prenom', 'date_naissance', 'sexe', 'telephone', 'email', 'ville',
    'niveau_etude', 'serie_bac', 'annee_bac', 'filiere_id', 'filiere_autre',
    'universite_id', 'type_universite', 'pays_bureau', 'contact', 'contact_telephone',
  ];
  const extra = Object.keys(b).filter((k) => !allowed.includes(k));
  if (extra.length) errors.push('Champs non autorisés dans la requête.');
  if (errors.length) return { error: errors[0], errors };
  return {
    data: {
      nom,
      prenom,
      date_naissance: String(b.date_naissance).slice(0, 10),
      sexe: b.sexe,
      telephone: tel,
      email,
      ville,
      niveau_etude: String(b.niveau_etude || '').trim().slice(0, 100) || null,
      serie_bac: String(b.serie_bac || '').trim().slice(0, 50) || null,
      annee_bac: String(b.annee_bac || '').trim().slice(0, 10) || null,
      filiere_id: filiereId,
      filiere_autre: filiereAutre || null,
      universite_id: universiteId,
      type_universite: b.type_universite,
      pays_bureau: b.pays_bureau,
      contact: contact || null,
      contact_telephone: contactTelephone || null,
    },
  };
}

async function createInscription(body) {
  const v = validateInscriptionBody(body);
  if (v.error) return { status: 400, body: { error: v.error, errors: v.errors } };
  const d = v.data;
  const { ensureInscriptionsWorkflow } = require('../database/ensureInscriptionsWorkflow');
  await ensureInscriptionsWorkflow();
  const [uRows] = await db.query('SELECT id, nom, type, ville FROM universites WHERE id = ?', [d.universite_id]);
  if (!uRows.length) return { status: 400, body: { error: 'Université invalide.' } };
  const [campusRows] = await db.query('SELECT ville FROM campuses WHERE universite_id = ?', [d.universite_id]);
  const validCities = new Set(campusRows.map((c) => String(c.ville || '').trim().toLowerCase()).filter(Boolean));
  if (!validCities.size) validCities.add(String(uRows[0].ville || '').trim().toLowerCase());
  if (!validCities.has(d.ville.trim().toLowerCase())) {
    return { status: 400, body: { error: 'Ville choisie non valide pour cette université.' } };
  }
  const [insertMeta] = await db.query(
    `INSERT INTO inscriptions (nom, prenom, date_naissance, sexe, telephone, email, ville, niveau_etude, serie_bac, annee_bac, filiere_id, filiere_autre, universite_id, type_universite, pays_bureau, contact, contact_telephone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.nom, d.prenom, d.date_naissance, d.sexe, d.telephone, d.email, d.ville,
      d.niveau_etude, d.serie_bac, d.annee_bac, d.filiere_id, d.filiere_autre,
      d.universite_id, d.type_universite, d.pays_bureau, d.contact, d.contact_telephone,
    ]
  );
  const inscriptionId = insertMeta?.insertId != null ? Number(insertMeta.insertId) : null;
  const [fRows] = d.filiere_id
    ? await db.query('SELECT nom FROM filieres WHERE id = ?', [d.filiere_id])
    : [[]];
  const { notifyNewInscription } = require('./notifications');
  notifyNewInscription({
    inscription_id: inscriptionId,
    nom: d.nom,
    prenom: d.prenom,
    date_naissance: d.date_naissance,
    sexe: d.sexe,
    email: d.email,
    telephone: d.telephone,
    ville: d.ville,
    niveau_etude: d.niveau_etude,
    serie_bac: d.serie_bac,
    annee_bac: d.annee_bac,
    filiere_id: d.filiere_id,
    filiere_autre: d.filiere_autre,
    universite_nom: uRows[0]?.nom || null,
    universite_id: d.universite_id,
    filiere_nom: fRows?.[0]?.nom || null,
    type_universite: d.type_universite,
    pays_bureau: d.pays_bureau,
    contact: d.contact,
    contact_telephone: d.contact_telephone,
  }).catch((e) => console.error('[inscriptions] notify:', e.message));
  writeAudit('inscription.created', {
    inscriptionId,
    universiteId: d.universite_id,
    type_universite: d.type_universite,
    pays_bureau: d.pays_bureau,
    email: d.email,
  });
  return { status: 201, body: { message: 'Demande d\'inscription enregistrée avec succès.' } };
}

module.exports = { createInscription, validateInscriptionBody };
