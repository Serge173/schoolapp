/**
 * Contact FIGS régional : une seule adresse / téléphone / WhatsApp (bureau Abidjan) pour Abidjan et le Burkina Faso.
 * @see https://www.figs-education.com/bureaux
 */

export const FIGS_ABIDJAN = {
  bureau: 'FIGS Education — Abidjan',
  pays: 'Côte d’Ivoire',
  responsable: 'Désirée YAHOU',
  email: 'admissions.abidjan@figs-education.com',
  phoneDisplay: '+225 07 57 68 85 19',
  /** Sans + : 225 + 10 chiffres nationaux (0 inclus) pour wa.me / tel — le 0 du 07 ne doit pas être retiré. */
  phoneDigitsInternational: '2250757688519',
  /** Deuxième ligne WhatsApp conseillers (même message via « Parler à un conseiller »). */
  phoneWhatsAppSecondaryDisplay: '+225 07 77 55 28 15',
  phoneWhatsAppSecondaryDigitsInternational: '2250777552815',
  siteFigs: 'https://www.figs-education.com/',
  pageBureaux: 'https://www.figs-education.com/bureaux',
};

/** Numéros WhatsApp pour le bouton « Parler à un conseiller » (ouverture des deux conversations). */
export const FIGS_WHATSAPP_CONSEILLER_DIGITS = [
  FIGS_ABIDJAN.phoneDigitsInternational,
  FIGS_ABIDJAN.phoneWhatsAppSecondaryDigitsInternational,
];

export function figsWhatsAppUrl(digitsInternational, prefillMessage) {
  const base = `https://wa.me/${digitsInternational}`;
  if (!prefillMessage) return base;
  return `${base}?text=${encodeURIComponent(prefillMessage)}`;
}

/** Lien wa.me vers la première ligne (télé affiché, footer, liens simples). */
export function figsRegionalWhatsAppUrl(prefillMessage) {
  return figsWhatsAppUrl(FIGS_WHATSAPP_CONSEILLER_DIGITS[0], prefillMessage);
}

/**
 * Ouvre deux onglets WhatsApp avec le même texte (wa.me ne gère qu’un destinataire par URL).
 * Petit délai entre les deux pour limiter le blocage des pop-ups.
 */
export function openParlerConseillerWhatsApp(prefillMessage) {
  const urls = FIGS_WHATSAPP_CONSEILLER_DIGITS.map((d) => figsWhatsAppUrl(d, prefillMessage));
  window.open(urls[0], '_blank', 'noopener,noreferrer');
  setTimeout(() => {
    window.open(urls[1], '_blank', 'noopener,noreferrer');
  }, 400);
}
