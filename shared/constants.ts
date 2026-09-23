export const BRAND = {
  name: "G.G FASHION",
  slogan: "L'élégance au féminin",
  origin: "Mode venant de Turquie",
  address:
    "Sur l’avenue Ruwe entre Maniema et Kasai, en face de Publi Inter, Lubumbashi",
  addressShort: "Avenue Ruwe entre Maniema et Kasai, en face de Publi Inter",
  city: "Lubumbashi",
  phoneDisplay: "+243 833302674",
  phoneE164: "243833302674",
  whatsappNumber: "243833302674",
  mapsQuery:
    "Avenue Ruwe entre Maniema et Kasai, en face de Publi Inter, Lubumbashi",
  adminPin: "8426",
  logo: "/logo.jpg",
  tiktokUrl: "https://www.tiktok.com/@alicempiana1?_r=1&_t=ZS-99whWLVkGtL",
  facebookUrl: "https://www.facebook.com/share/1DfqacebEQ/?mibextid=wwXIfr",
} as const;

export const COLORS = {
  gold: "#D4AF37",
  powder: "#F4E3E5",
  powderDeep: "#E8C5C8",
  ivory: "#FAF8F5",
  ink: "#1A1A1A",
  white: "#FFFFFF",
} as const;

export const CATEGORIES = [
  {
    id: "robes-grandes-dames",
    label: "Robes de grandes dames",
    short: "Robes",
    description: "Silhouettes longues, tissus nobles et allure de réception.",
  },
  {
    id: "complets-jeans",
    label: "Complets Jeans",
    short: "Jeans",
    description: "Ensembles denim structurés, coupe contemporaine.",
  },
  {
    id: "sacs-dames",
    label: "Sacs dames",
    short: "Sacs",
    description: "Maroquinerie raffinée pour le jour et le soir.",
  },
  {
    id: "chaussures-dames",
    label: "Chaussures dames",
    short: "Chaussures",
    description: "Escarpins, sandales et souliers d’exception.",
  },
  {
    id: "habits-jeunes-filles",
    label: "Habits de jeunes filles",
    short: "Jeunes filles",
    description: "Pièces lumineuses, modernes et festives.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_ALIASES: Record<string, CategoryId> = {
  robes: "robes-grandes-dames",
  jeans: "complets-jeans",
  sacs: "sacs-dames",
  chaussures: "chaussures-dames",
  "jeunes-filles": "habits-jeunes-filles",
};

export function resolveCategoryId(slug: string | undefined) {
  if (!slug) return undefined;
  if (slug in CATEGORY_ALIASES) return CATEGORY_ALIASES[slug];
  return CATEGORIES.find((c) => c.id === slug)?.id;
}

export function categoryStaticParams() {
  return [
    { category: "robes" },
    { category: "jeans" },
    { category: "sacs" },
    { category: "chaussures" },
    { category: "jeunes-filles" },
    ...CATEGORIES.map((c) => ({ category: c.id })),
  ];
}

export const HERO_SLIDES = [
  {
    id: "slide-1",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515e0c046?auto=format&fit=crop&w=1920&q=80",
    alt: "Mannequin en robe de soirée",
  },
  {
    id: "slide-2",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80",
    alt: "Collection mode féminine en mouvement",
  },
  {
    id: "slide-3",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1920&q=80",
    alt: "Shopping chic et élégance urbaine",
  },
  {
    id: "slide-4",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1920&q=80",
    alt: "Portrait haute couture",
  },
] as const;

export function mapsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    BRAND.mapsQuery,
  )}`;
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function whatsappOrderUrl(
  productName: string,
  options?: { category?: string; photoUrl?: string },
) {
  const category = options?.category
    ? ` (Catégorie : ${options.category})`
    : "";
  const text = `Bonjour ${BRAND.name}, je souhaite commander l'article : ${productName}${category}. Est-il disponible ?`;
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function whatsappContactUrl() {
  const text = `Bonjour ${BRAND.name}, je souhaite des informations sur vos collections.\n${BRAND.slogan}`;
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function telUrl() {
  return `tel:+${BRAND.whatsappNumber}`;
}
