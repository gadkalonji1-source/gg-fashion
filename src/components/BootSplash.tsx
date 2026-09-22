"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { BRAND } from "@shared/constants";
import { useShop } from "@/context/ShopContext";

export function BootSplash() {
  const { loading } = useShop();
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[var(--ivory)]">
      <BrandLogo className="splash-logo h-32 w-32" />
      <p className="mt-6 font-serif text-xl tracking-[0.32em]">{BRAND.name}</p>
      <p className="mt-2 text-sm italic tracking-[0.16em] text-[var(--accent)]">
        {BRAND.slogan}
      </p>
    </div>
  );
}
