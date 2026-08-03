import { figsRegionalWhatsAppUrl } from './figsBureaus';

const env = import.meta.env;

/**
 * Liens réseaux sociaux du footer.
 * Priorité : variables VITE_SOCIAL_* dans .env, sinon les valeurs par défaut ci-dessous.
 * Remplacez les URLs par défaut par vos comptes officiels si besoin.
 */
export function getFooterSocialLinks() {
  const whatsappDefault = figsRegionalWhatsAppUrl('Bonjour FIGS Education 👋');

  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: env.VITE_SOCIAL_WHATSAPP || whatsappDefault,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: env.VITE_SOCIAL_FACEBOOK || 'https://www.facebook.com/FIGS.SN',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: env.VITE_SOCIAL_INSTAGRAM || 'https://www.instagram.com/figs_education/',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: env.VITE_SOCIAL_TIKTOK || 'https://www.tiktok.com/@figs_education',
    },
    {
      id: 'snapchat',
      label: 'Snapchat',
      href: env.VITE_SOCIAL_SNAPCHAT || 'https://www.snapchat.com/add/figs-education',
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      href: env.VITE_SOCIAL_TWITTER || 'https://x.com/figs_education',
    },
  ];
}
