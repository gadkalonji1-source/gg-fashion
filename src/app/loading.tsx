import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@shared/constants";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--ivory)]">
      <BrandLogo className="splash-logo h-28 w-28" />
      <p className="mt-5 font-serif text-lg tracking-[0.28em]">{BRAND.name}</p>
      <p className="mt-2 text-sm italic text-[var(--accent)]">{BRAND.slogan}</p>
    </div>
  );
}
