"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@shared/constants";
import { useShop } from "@/context/ShopContext";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Collection" },
  { href: "/avis", label: "Avis" },
  { href: "/contact", label: "Contact" },
  { href: "/favoris", label: "Favoris" },
  { href: "/panier", label: "Panier" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const { favorites, cart } = useShop();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--gold)]/25 bg-[rgba(250,248,245,0.94)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo className="h-12 w-12 object-contain" />
          <span className="text-left leading-tight">
            <span className="block font-serif text-[1.55rem] tracking-[0.18em] text-[var(--ink)]">
              {BRAND.name}
            </span>
            <span className="mt-0.5 block font-sans text-sm italic tracking-[0.14em] text-[var(--accent)]">
              {BRAND.slogan}
            </span>
          </span>
        </Link>
        <button
          className="border border-[var(--gold)]/60 px-4 py-2 text-sm uppercase tracking-[0.18em]"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(100%,22rem)] flex-col border-l border-[#D4AF37]/40 bg-[#1A1A1A] text-[#FAFAFA]">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/30 px-6 py-5">
              <p className="font-serif text-xl tracking-[0.18em]">{BRAND.name}</p>
              <button
                className="text-sm uppercase tracking-[0.16em] text-[#C85A32]"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-4 py-6 text-lg">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-white/10 px-2 py-3.5 tracking-wide text-[#F4E3E5]"
                >
                  {l.label}
                  {l.href === "/favoris" ? ` (${favorites.length})` : ""}
                  {l.href === "/panier" ? ` (${cart.length})` : ""}
                </Link>
              ))}
            </nav>
            <p className="mt-auto border-t border-[#D4AF37]/25 px-6 py-5 text-sm italic text-[#F4E3E5]/55">
              {BRAND.slogan}
            </p>
          </aside>
        </div>
      )}
    </header>
  );
}
