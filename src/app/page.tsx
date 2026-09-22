"use client";

import Link from "next/link";
import { CATEGORIES, BRAND } from "@shared/constants";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { SocialButtons } from "@/components/SocialButtons";
import { useLiveProducts } from "@/hooks/useLiveProducts";

export default function Home() {
  const { products, loading } = useLiveProducts();
  const featured = products.slice(0, 6);

  return (
    <>
      <HeroSlider />
      <SocialButtons />
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-sm uppercase tracking-[0.32em] text-[var(--accent)]">
          {BRAND.origin}
        </p>
        <h2 className="mt-4 font-serif text-5xl italic">Cinq univers, une élégance</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/catalogue/${c.id}`}
              className="rounded-2xl border border-[var(--gold)]/20 bg-white px-4 py-10 shadow-[0_10px_30px_rgba(26,26,26,0.05)] transition hover:border-[var(--gold)]"
            >
              <p className="font-serif text-[1.45rem] leading-snug">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-y border-[var(--gold)]/15 bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
                Sélection
              </p>
              <h2 className="mt-2 font-serif text-5xl italic">Dernières pièces</h2>
            </div>
            <Link href="/catalogue" className="text-sm uppercase tracking-[0.16em] text-[var(--accent)]">
              Voir tout
            </Link>
          </div>
          {loading ? (
            <p className="italic">Chargement de la collection…</p>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
