import {
  figsRegionalWhatsAppUrl,
  openParlerConseillerWhatsApp,
} from '../data/figsBureaus';

/**
 * Ouvre les deux lignes WhatsApp conseillers avec le même message prérempli.
 */
export default function ParlerConseillerWhatsAppLink({ prefillMessage, className, children }) {
  return (
    <a
      href={figsRegionalWhatsAppUrl(prefillMessage)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title="Ouvre WhatsApp sur les deux numéros conseillers avec le même message"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openParlerConseillerWhatsApp(prefillMessage);
      }}
    >
      {children}
    </a>
  );
}
