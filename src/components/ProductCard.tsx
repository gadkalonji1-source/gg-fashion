import Link from "next/link";
import { categoryLabel, whatsappOrderUrl } from "@shared/constants";
import type { Product } from "@shared/types";
import { HeartButton } from "./HeartButton";
import { WhatsAppButton } from "./WhatsAppButton";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const label = categoryLabel(product.category);
  const wa = whatsappOrderUrl(product.name, { category: label, photoUrl: image });

  return (
    <article className="group flex flex-col rounded-2xl border border-[var(--gold)]/20 bg-white p-2 shadow-[0_10px_30px_rgba(26,26,26,0.06)]">
      <Link href={`/produit?id=${encodeURIComponent(product.id)}`} className="block overflow-hidden rounded-xl bg-[var(--powder)]">
        <div className="relative aspect-[3/4]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm tracking-[0.2em]">
              Image à venir
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
              {label}
            </p>
            <Link
              href={`/produit?id=${encodeURIComponent(product.id)}`}
              className="mt-1 block font-serif text-[1.65rem] leading-tight text-[var(--ink)]"
            >
              {product.name}
            </Link>
          </div>
          <HeartButton productId={product.id} />
        </div>
        <WhatsAppButton href={wa} className="mt-5 w-full" />
      </div>
    </article>
  );
}
