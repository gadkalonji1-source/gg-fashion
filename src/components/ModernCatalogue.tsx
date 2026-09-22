"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type CategoryId } from "@shared/constants";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useShop } from "@/context/ShopContext";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

const bottomItems = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/catalogue", label: "Catégories", icon: "◇" },
  { href: "/favoris", label: "Favoris", icon: "♡" },
  { href: "/contact", label: "Profil", icon: "○" },
];

export function ModernCatalogue({ activeCategory }: { activeCategory?: CategoryId }) {
  const { cart, addToCart } = useShop();
  const { products, loading, error, refresh } = useLiveProducts();
  const [query, setQuery] = useState("");

  useEffect(() => {
    void refresh(true);
  }, [activeCategory, refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return products.filter((product) => {
      const inCategory = !activeCategory || product.category === activeCategory;
      const matches =
        !normalized ||
        product.name.toLocaleLowerCase("fr").includes(normalized) ||
        product.description.toLocaleLowerCase("fr").includes(normalized);
      return inCategory && matches;
    });
  }, [activeCategory, products, query]);

  const heroProduct = products.find((p) => p.category === activeCategory) ?? products[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-7 sm:px-6">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--gold)]/15 bg-white px-5 py-3.5 text-[var(--ink)]/50 shadow-sm">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un produit..."
            className="!border-0 !bg-transparent !p-0 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/40"
          />
        </label>
        <Link
          href="/panier"
          aria-label={`Panier, ${cart.length} article(s)`}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-white shadow-lg"
        >
          <CartIcon />
          {cart.length > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#C62828] px-1 text-[10px] font-semibold text-white">
              {cart.length}
            </span>
          )}
        </Link>
      </div>

      <section className="relative mt-7 min-h-[300px] overflow-hidden rounded-[2rem] bg-[var(--ink)] text-white shadow-xl">
        {heroProduct?.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroProduct.images[0]}
            alt=""
            className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-80 sm:w-[45%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/95 to-transparent" />
        <div className="relative z-10 flex min-h-[300px] max-w-[66%] flex-col justify-center p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Nouvelle collection
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">
            Découvrez nos nouveaux produits
          </h1>
          <p className="mt-3 hidden max-w-md text-base text-white/65 sm:block">
            Des pièces féminines choisies avec soin, directement inspirées des collections turques.
          </p>
          <Link
            href={heroProduct ? `/produit?id=${encodeURIComponent(heroProduct.id)}` : "/catalogue"}
            className="mt-7 w-fit rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--accent-dark)]"
          >
            Acheter maintenant
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl font-semibold">Catégories</h2>
          <Link href="/catalogue" className="text-sm font-medium text-[var(--accent)]">
            Voir tout ›
          </Link>
        </div>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => {
            const image = products.find((p) => p.category === category.id)?.images[0];
            const active = category.id === activeCategory;
            return (
              <Link
                key={category.id}
                href={`/catalogue/${category.id}`}
                className="w-28 shrink-0 rounded-2xl border border-[var(--gold)]/20 bg-white p-2 text-center shadow-[0_8px_24px_rgba(26,26,26,0.05)]"
              >
                <span
                  className={`block aspect-square overflow-hidden rounded-xl border-2 bg-[#F5F1EC] p-1 transition ${
                    active ? "border-[var(--gold)] shadow-lg" : "border-transparent"
                  }`}
                >
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full rounded-xl object-cover" />
                  )}
                </span>
                <span className={`mt-2 block text-sm leading-tight ${active ? "font-semibold text-[var(--accent)]" : ""}`}>
                  {category.short}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl font-semibold">
            {activeCategory ? CATEGORIES.find((c) => c.id === activeCategory)?.label : "Produits populaires"}
          </h2>
          <Link href="/catalogue" className="text-sm font-medium text-[var(--accent)]">
            Voir tout ›
          </Link>
        </div>

        {loading ? (
          <p className="mt-8 text-[var(--ink)]/50">Chargement de la collection…</p>
        ) : error && products.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-[var(--gold)]/15 bg-white p-6 text-center text-[var(--ink)]/55 shadow-sm">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-[var(--gold)]/15 bg-white p-6 text-center text-[var(--ink)]/55 shadow-sm">
            Aucun produit ne correspond à votre recherche.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <article
                key={product.id}
                className="group min-w-0 rounded-2xl border border-[var(--gold)]/20 bg-white p-2 shadow-[0_10px_30px_rgba(26,26,26,0.06)]"
              >
                <Link
                  href={`/produit?id=${encodeURIComponent(product.id)}`}
                  className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-[#F5F1EC]"
                >
                  {product.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                </Link>
                <div className="flex items-end gap-2 px-1 pt-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/produit?id=${encodeURIComponent(product.id)}`} className="block truncate font-serif text-lg font-semibold sm:text-xl">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs font-medium text-[var(--accent)] sm:text-sm">
                      Disponible sur demande
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    aria-label={`Ajouter ${product.name} au panier`}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                      cart.includes(product.id)
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--ink)] text-white hover:bg-[var(--accent)]"
                    }`}
                  >
                    <CartIcon className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--gold)]/20 bg-white/95 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {bottomItems.map((item) => {
            const active = item.label === "Catégories";
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 text-xs ${active ? "text-[var(--accent)]" : "text-[var(--ink)]/55"}`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
