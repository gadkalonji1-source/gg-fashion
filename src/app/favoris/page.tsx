"use client";

import { ProductCard } from "@/components/ProductCard";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useShop } from "@/context/ShopContext";

export default function FavoritesPage() {
  const { favorites } = useShop();
  const { products } = useLiveProducts();
  const items = products.filter((p) => favorites.includes(p.id));
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-serif text-5xl italic">Favoris</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-sm italic">Aucun article aimé pour le moment.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
