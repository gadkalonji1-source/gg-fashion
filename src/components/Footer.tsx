import Link from "next/link";
import { BRAND, mapsUrl, whatsappContactUrl } from "@shared/constants";
import { BrandLogo } from "@/components/BrandLogo";
import { SocialButtons } from "@/components/SocialButtons";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--gold)]/25 bg-[var(--powder)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <BrandLogo className="h-16 w-16 object-contain" />
          <p className="mt-3 font-serif text-2xl tracking-[0.2em]">{BRAND.name}</p>
          <p className="mt-2 text-base italic text-[var(--accent)]">{BRAND.slogan}</p>
          <p className="mt-3 text-base text-[var(--ink)]/70">{BRAND.origin}</p>
        </div>
        <div className="text-base leading-8">
          <p className="mb-1 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
            Boutique
          </p>
          <p>{BRAND.addressShort}</p>
          <p>{BRAND.city}</p>
          <a className="mt-2 inline-block text-[var(--accent)]" href={mapsUrl()} target="_blank">
            Voir sur la carte
          </a>
        </div>
        <div className="text-base leading-8">
          <p className="mb-1 text-sm uppercase tracking-[0.18em] text-[var(--accent)]">
            Contact
          </p>
          <a href={`tel:${BRAND.phoneDisplay}`}>{BRAND.phoneDisplay}</a>
          <br />
          <a href={whatsappContactUrl()} target="_blank">
            WhatsApp
          </a>
          <div className="mt-4">
            <SocialButtons compact />
          </div>
          <div className="mt-3 flex gap-4 text-sm uppercase tracking-[0.14em]">
            <Link href="/catalogue">Collection</Link>
            <Link href="/avis">Avis</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
