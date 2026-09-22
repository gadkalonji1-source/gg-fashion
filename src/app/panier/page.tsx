"use client";

import Link from "next/link";
import { categoryLabel, whatsappOrderUrl } from "@shared/constants";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useShop } from "@/context/ShopContext";

export default function CartPage() {
  const { cart, removeFromCart } = useShop();
  const { products } = useLiveProducts();
  const items = products.filter((p) => cart.includes(p.id));
  const names = items.map((p) => p.name).join(", ");
  const wa = whatsappOrderUrl(names || "ma sélection", {
    category: items[0] ? categoryLabel(items[0].category) : "sélection",
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-serif text-5xl italic">Panier</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-sm italic">
          Votre panier est vide.{" "}
          <Link href="/catalogue" className="text-[var(--accent)]">
            Voir la collection
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-4 border-b border-[var(--powder-deep)] py-4">
              {p.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt="" className="h-20 w-16 object-cover" />
              )}
              <div className="flex-1">
                <Link href={`/produit?id=${encodeURIComponent(p.id)}`} className="font-serif text-xl">
                  {p.name}
                </Link>
              </div>
              <button className="text-xs uppercase tracking-[0.14em]" onClick={() => removeFromCart(p.id)}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <a href={wa} target="_blank" rel="noreferrer" className="wa-btn mt-8">
          Commander via WhatsApp
        </a>
      )}
    </div>
  );
}
