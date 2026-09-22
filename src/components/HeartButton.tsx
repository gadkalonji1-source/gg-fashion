"use client";

import { useShop } from "@/context/ShopContext";

export function HeartButton({ productId }: { productId: string }) {
  const { favorites, toggleFavorite } = useShop();
  const active = favorites.includes(productId);
  return (
    <button
      aria-label="J'aime"
      onClick={() => toggleFavorite(productId)}
      className={`text-2xl leading-none ${active ? "text-[var(--accent)]" : "text-[var(--ink)]/40"}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
