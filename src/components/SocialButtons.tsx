import { BRAND } from "@shared/constants";

function TikTokIcon() {
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center" aria-hidden>
      <span className="absolute translate-x-[2px] translate-y-[1px] text-[1.35rem] font-bold leading-none text-[#25F4EE]">
        ♪
      </span>
      <span className="absolute -translate-x-[2px] -translate-y-[1px] text-[1.35rem] font-bold leading-none text-[#FE2C55]">
        ♪
      </span>
      <span className="relative text-[1.35rem] font-bold leading-none text-white">♪</span>
    </span>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.1C12.6 3 11 4.6 11 6.6v1.9H9v2.6h2V21h3v-9.9h2.2l.3-2.6H14.5z" />
    </svg>
  );
}

export function SocialButtons({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "mx-auto max-w-6xl px-5 py-12 text-center"}>
      {!compact && (
        <>
          <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent)]">Réseaux</p>
          <h2 className="mt-3 font-serif text-4xl italic sm:text-5xl">Suivez G.G FASHION</h2>
        </>
      )}
      <div className={`flex flex-wrap gap-3 ${compact ? "justify-start" : "mt-8 justify-center"}`}>
        <a
          href={BRAND.tiktokUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Ouvrir TikTok"
          className="social-btn social-tiktok"
        >
          <TikTokIcon />
          TikTok
        </a>
        <a
          href={BRAND.facebookUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Ouvrir Facebook"
          className="social-btn social-facebook"
        >
          <FacebookIcon />
          Facebook
        </a>
      </div>
    </section>
  );
}
