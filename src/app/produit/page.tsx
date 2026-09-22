import { Suspense } from "react";
import { ProductPageClient } from "./[id]/ProductPageClient";

export default function ProductQueryPage() {
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
