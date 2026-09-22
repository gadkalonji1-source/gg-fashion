import { Suspense } from "react";
import { SEED } from "@shared/seed";
import { ProductPageClient } from "./ProductPageClient";

export async function generateStaticParams() {
  return SEED.products.map((product) => ({ id: product.id }));
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-24 text-center italic text-[var(--ink)]/60">
          Chargement de la pièce…
        </div>
      }
    >
      <ProductPageClient />
    </Suspense>
  );
}
