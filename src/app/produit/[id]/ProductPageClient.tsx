"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, categoryLabel, whatsappOrderUrl } from "@shared/constants";
import { HeartButton } from "@/components/HeartButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useShop } from "@/context/ShopContext";

export function ProductPageClient() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const productId = params.id ?? searchParams.get("id");
  const { addToCart } = useShop();
  const { products, loading } = useLiveProducts();
  const product = products.find((p) => p.id === productId);
  const [zoom, setZoom] = useState(false);
  const [current, setCurrent] = useState(0);
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <div className="px-5 py-24 text-center italic text-[var(--ink)]/60">
        Chargement de la pièce…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-5 py-24 text-center">
        <p>Article introuvable.</p>
        <Link href="/catalogue" className="mt-4 inline-block text-[var(--accent)]">
          Retour à la collection
        </Link>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === product.category);
  const image = product.images[current] ?? product.images[0];
  const wa = whatsappOrderUrl(product.name, {
    category: categoryLabel(product.category),
    photoUrl: image,
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-2">
      <div>
        <button
          className="relative block w-full overflow-hidden bg-[var(--powder)]"
          onClick={() => image && setZoom(true)}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="aspect-[3/4] w-full object-cover transition duration-500 hover:scale-125"
            />
          ) : (
            <div className="aspect-[3/4] grid place-items-center">Sans image</div>
          )}
          <span className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 text-[10px] uppercase tracking-[0.16em]">
            Zoom
          </span>
        </button>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((src, i) => (
              <button key={src} onClick={() => setCurrent(i)} className="w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className={`aspect-square object-cover ${i === current ? "ring-1 ring-[var(--gold)]" : "opacity-70"}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent)]">
          {category?.label}
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="font-serif text-5xl italic sm:text-6xl">{product.name}</h1>
          <HeartButton productId={product.id} />
        </div>
        <p className="mt-6 max-w-md text-lg leading-8 text-[var(--ink)]/75">
          {product.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <WhatsAppButton href={wa} />
          <button
            className="ghost-btn"
            onClick={() => {
              addToCart(product.id);
              setAdded(true);
            }}
          >
            {added ? "Ajouté au panier" : "Ajouter au panier"}
          </button>
        </div>
      </div>
      {zoom && image && (
        <div
          className="fixed inset-0 z-50 cursor-zoom-out bg-black/90 p-6"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.name} className="mx-auto h-full object-contain" />
        </div>
      )}
    </div>
  );
}
