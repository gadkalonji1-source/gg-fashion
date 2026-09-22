"use client";

import Link from "next/link";
import { CATEGORIES } from "@shared/constants";

export function CategoryTabs({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Catégories"
      className="sticky top-[5.6rem] z-30 -mx-5 mb-10 border-y border-[var(--gold)]/25 bg-[rgba(250,248,245,0.96)] px-5 py-3.5 backdrop-blur-md"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/catalogue"
          className={`cat-tab shrink-0 ${!active ? "cat-tab-on" : ""}`}
        >
          Toute la collection
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/catalogue/${c.id}`}
            className={`cat-tab shrink-0 ${active === c.id ? "cat-tab-on" : ""}`}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
