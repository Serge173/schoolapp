/**
 * Bureaux FIGS couverts par SchoolApp : Abidjan (Côte d’Ivoire) et Burkina Faso.
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
  siteFigs: 'https://www.figs-education.com/',
  pageBureaux: 'https://www.figs-education.com/bureaux',
};

/** Bureau Burkina Faso — email dédié ; coordination avec le réseau FIGS (voir site officiel). */
export const FIGS_BURKINA = {
  bureau: 'FIGS Education — Burkina Faso',
  pays: 'Burkina Faso',
  email: 'admissions.burkinafaso@figs-education.com',
};

/** Ligne WhatsApp : numéro du bureau Abidjan (usage régional FIGS pour les deux territoires). */
export function figsRegionalWhatsAppUrl(prefillMessage) {
  const base = `https://wa.me/${FIGS_ABIDJAN.phoneDigitsInternational}`;
  if (!prefillMessage) return base;
  return `${base}?text=${encodeURIComponent(prefillMessage)}`;
}
