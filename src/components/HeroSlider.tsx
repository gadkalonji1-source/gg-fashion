"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BRAND } from "@shared/constants";
import { useLiveProducts } from "@/hooks/useLiveProducts";

const FALLBACK_SLIDES = [
  { id: "fallback-1", image: "/hero1.jpg", alt: "Robe haute couture bordeaux" },
  { id: "fallback-2", image: "/hero2.jpg", alt: "Ensemble féminin ivoire et denim" },
  { id: "fallback-3", image: "/hero3.jpg", alt: "Sac à main de luxe et robe noire" },
  { id: "fallback-4", image: "/hero4.jpg", alt: "Robe rose poudré et chaussures élégantes" },
] as const;

export function HeroSlider() {
  const { products } = useLiveProducts();
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => {
    const latestProducts = [...products]
      .filter((product) => Boolean(product.images[0]))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    if (!latestProducts.length) return [...FALLBACK_SLIDES];
    return latestProducts.map((product) => ({
      id: product.id,
      image: product.images[0],
      alt: product.name,
      productName: product.name,
      href: `/produit?id=${encodeURIComponent(product.id)}`,
    }));
  }, [products]);

  useEffect(() => setIndex(0), [slides.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[index] ?? slides[0];
  const activeHref = "href" in activeSlide ? activeSlide.href : "/catalogue";

  return (
    <section className="relative h-[72svh] min-h-[540px] max-h-[820px] overflow-hidden bg-[var(--ink)]">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <Link
            href={"href" in slide ? slide.href : "/catalogue"}
            aria-label={`Découvrir ${slide.alt}`}
            className="absolute inset-0 z-[1]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt={slide.alt}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            className="h-full w-full object-cover object-[center_25%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/15" />
        </div>
      ))}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-[13px] uppercase tracking-[0.42em] text-[var(--accent)]">
          {BRAND.name}
        </p>
        <h1 className="mt-4 font-serif text-5xl italic sm:text-7xl">
          {BRAND.slogan}
        </h1>
        <p className="mt-5 max-w-lg text-lg tracking-wide text-white/85">
          {BRAND.origin} • Lubumbashi
        </p>
        {"productName" in activeSlide && (
          <p className="mt-3 font-serif text-xl italic text-white/90">
            {activeSlide.productName}
          </p>
        )}
        <Link
          href={activeHref}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#B85028] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-lg transition hover:bg-[#A74624]"
        >
          Découvrir la collection
        </Link>
      </div>
      <div className="absolute bottom-7 left-0 right-0 z-20 flex justify-center gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? "w-12 bg-[#B85028]" : "w-6 bg-white/45 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
