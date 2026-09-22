"use client";

import { useParams } from "next/navigation";
import { resolveCategoryId } from "@shared/constants";
import { ModernCatalogue } from "@/components/ModernCatalogue";

export function CategoryPageClient() {
  const params = useParams<{ category: string }>();
  const resolved = resolveCategoryId(params.category);
  return <ModernCatalogue activeCategory={resolved} />;
}
