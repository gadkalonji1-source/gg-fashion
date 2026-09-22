import { BRAND, mapsUrl, telUrl, whatsappContactUrl } from "@shared/constants";
import { SocialButtons } from "@/components/SocialButtons";

export default function ContactPage() {
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(BRAND.mapsQuery)}&z=16&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
        Boutique
      </p>
      <h1 className="mt-2 font-serif text-5xl italic">Contact & localisation</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-5 text-sm leading-7">
          <p>
            <strong>Adresse</strong>
            <br />
            {BRAND.address}
          </p>
          <p>
            <strong>Téléphone / WhatsApp</strong>
            <br />
            <a href={telUrl()}>{BRAND.phoneDisplay}</a>
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a className="gold-btn" href={mapsUrl()} target="_blank" rel="noreferrer">
              Ouvrir la carte
            </a>
            <a className="ghost-btn" href={whatsappContactUrl()} target="_blank" rel="noreferrer">
              Écrire sur WhatsApp
            </a>
          </div>
          <div className="pt-4">
            <SocialButtons compact />
          </div>
        </div>
        <iframe
          title="Carte G.G FASHION Lubumbashi"
          src={embed}
          className="h-[360px] w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}
