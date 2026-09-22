import { CategoryPageClient } from "./CategoryPageClient";

export async function generateStaticParams() {
  return [
    { category: "robes" },
    { category: "jeans" },
    { category: "sacs" },
    { category: "chaussures" },
    { category: "jeunes-filles" },
    { category: "robes-grandes-dames" },
    { category: "complets-jeans" },
    { category: "sacs-dames" },
    { category: "chaussures-dames" },
    { category: "habits-jeunes-filles" },
  ];
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
