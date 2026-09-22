import { WhatsAppIcon } from "./WhatsAppIcon";

export function WhatsAppButton({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`wa-btn ${className}`}
    >
      <WhatsAppIcon />
      Commander via WhatsApp
    </a>
  );
}
