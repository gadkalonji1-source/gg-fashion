"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { BRAND } from "@shared/constants";
import {
  fetchRemoteProducts,
  mergeCatalog,
  resolveSupabaseConfig,
  sameCatalog,
  supabasePublicConfig,
} from "@shared/catalog";
import { SEED } from "@shared/seed";
import type { Announcement, Product, Review } from "@shared/types";

const FAVORITES_KEY = "gg-favorites";
const CART_KEY = "gg-cart";
const ADMIN_PIN_KEY = "gg-admin-pin";
const LOCAL_PRODUCTS_KEY = "gg-admin-products";
const LOCAL_PRODUCTS_DIRTY_KEY = "gg-admin-products-dirty";

type ProductDraft = Pick<Product, "name" | "category" | "description" | "images"> & {
  id?: string;
};

type SaveResult = {
  ok: boolean;
  storage: "supabase" | "local";
  error?: string;
};

const CATALOG_EVENT = "gg-products-changed";

async function saveSupabaseProduct(product: Product, pin: string) {
  const config = (await resolveSupabaseConfig()) ?? supabasePublicConfig();
  if (!config) return false;
  const body = {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    images: product.images,
    created_at: product.createdAt,
  };
  const response = await fetch(
    `${config.url}/rest/v1/products?on_conflict=id`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
        "x-admin-pin": pin,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    },
  );
  return response.ok;
}

function notifyCatalogChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CATALOG_EVENT));
}

async function deleteSupabaseProducts(ids: string[], pin: string) {
  const config = (await resolveSupabaseConfig()) ?? supabasePublicConfig();
  if (!config || !ids.length) return false;
  const filter = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
  const response = await fetch(`${config.url}/rest/v1/products?id=in.(${filter})`, {
    method: "DELETE",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "x-admin-pin": pin,
    },
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

function readLocalProducts(): Product[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalProducts(next: Product[], dirty: boolean) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(next));
  if (dirty) localStorage.setItem(LOCAL_PRODUCTS_DIRTY_KEY, "1");
  else localStorage.removeItem(LOCAL_PRODUCTS_DIRTY_KEY);
}

type ShopContextValue = {
  products: Product[];
  reviews: Review[];
  announcements: Announcement[];
  activeAnnouncement: Announcement | null;
  loading: boolean;
  favorites: string[];
  cart: string[];
  adminPin: string | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  unlockAdmin: (pin: string) => Promise<boolean>;
  lockAdmin: () => void;
  saveProduct: (draft: ProductDraft) => Promise<SaveResult>;
  deleteProducts: (ids: string[]) => Promise<SaveResult>;
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const productsRef = useRef<Product[]>([]);
  const refreshingRef = useRef(false);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    setCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    setAdminPin(sessionStorage.getItem(ADMIN_PIN_KEY));
  }, []);

  const applyProducts = useCallback((next: Product[]) => {
    if (sameCatalog(productsRef.current, next)) return;
    productsRef.current = next;
    setProducts(next);
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const localDirty = localStorage.getItem(LOCAL_PRODUCTS_DIRTY_KEY) === "1";
      const localProducts = readLocalProducts();
      setReviews(SEED.reviews);
      setAnnouncements(SEED.announcements);

      const remoteProducts = await fetchRemoteProducts();
      if (remoteProducts) {
        const next = mergeCatalog(remoteProducts, localProducts, localDirty);
        applyProducts(next);
        if (!localDirty) {
          try {
            writeLocalProducts(next, false);
          } catch {
            // cache locale facultative
          }
        }
        return;
      }

      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("catalog");
      const data = await res.json();
      applyProducts(mergeCatalog(data.products ?? [], localProducts, localDirty));
    } catch {
      const fallback = readLocalProducts();
      applyProducts(fallback?.length ? fallback : productsRef.current);
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, [applyProducts]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    const onFocus = () => {
      void refresh(true);
    };
    const onCatalog = () => {
      void refresh(true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_PRODUCTS_KEY || event.key === LOCAL_PRODUCTS_DIRTY_KEY) {
        void refresh(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(CATALOG_EVENT, onCatalog);
    window.addEventListener("storage", onStorage);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, 12000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(CATALOG_EVENT, onCatalog);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(poll);
    };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    let client: ReturnType<typeof createClient> | null = null;
    resolveSupabaseConfig().then((config) => {
      if (cancelled || !config) return;
      client = createClient(config.url, config.key, {
        auth: { persistSession: false },
      });
      client
        .channel("gg-products-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            void refresh(true);
          },
        )
        .subscribe();
    });
    return () => {
      cancelled = true;
      if (client) void client.removeAllChannels();
    };
  }, [refresh]);

  const persistFavorites = (next: string[]) => {
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };
  const persistCart = (next: string[]) => {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const value = useMemo<ShopContextValue>(() => {
    const activeAnnouncement =
      announcements.find((a) => a.active) ?? null;
    return {
      products,
      reviews,
      announcements,
      activeAnnouncement,
      loading,
      favorites,
      cart,
      adminPin,
      isAdmin: Boolean(adminPin),
      refresh,
      toggleFavorite: (id) => {
        persistFavorites(
          favorites.includes(id)
            ? favorites.filter((f) => f !== id)
            : [...favorites, id],
        );
      },
      addToCart: (id) => {
        if (!cart.includes(id)) persistCart([...cart, id]);
      },
      removeFromCart: (id) => persistCart(cart.filter((c) => c !== id)),
      unlockAdmin: async (pin) => {
        if (pin !== BRAND.adminPin) return false;
        sessionStorage.setItem(ADMIN_PIN_KEY, pin);
        setAdminPin(pin);
        return true;
      },
      lockAdmin: () => {
        sessionStorage.removeItem(ADMIN_PIN_KEY);
        setAdminPin(null);
      },
      saveProduct: async (draft) => {
        const name = draft.name.trim();
        if (!name) {
          return { ok: false, storage: "local", error: "Le nom de l’article est obligatoire." };
        }

        const current = productsRef.current;
        const existing = draft.id
          ? current.find((product) => product.id === draft.id)
          : undefined;
        const product: Product = {
          id: draft.id ?? crypto.randomUUID(),
          name,
          category: draft.category,
          description: draft.description.trim(),
          images: draft.images.filter(Boolean),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };

        let savedRemotely = false;
        try {
          savedRemotely = await saveSupabaseProduct(product, adminPin ?? "");
        } catch {
          savedRemotely = false;
        }

        const next = existing
          ? current.map((item) => (item.id === product.id ? product : item))
          : [product, ...current];
        productsRef.current = next;
        setProducts(next);
        try {
          writeLocalProducts(next, !savedRemotely);
        } catch {
          try {
            writeLocalProducts(
              next.map((item) => ({ ...item, images: item.images.slice(0, 4) })),
              true,
            );
          } catch {
            // L’article reste visible dans la session même si le quota local est plein.
          }
        }
        notifyCatalogChanged();
        if (savedRemotely) void refresh(true);
        return {
          ok: true,
          storage: savedRemotely ? "supabase" : "local",
        };
      },
      deleteProducts: async (ids) => {
        if (!ids.length) {
          return { ok: false, storage: "local", error: "Aucun article sélectionné." };
        }
        let deletedRemotely = false;
        try {
          deletedRemotely = await deleteSupabaseProducts(ids, adminPin ?? "");
        } catch {
          deletedRemotely = false;
        }
        const next = productsRef.current.filter((product) => !ids.includes(product.id));
        productsRef.current = next;
        setProducts(next);
        try {
          writeLocalProducts(next, !deletedRemotely);
        } catch {
          return { ok: false, storage: "local", error: "Impossible de supprimer l’article." };
        }
        notifyCatalogChanged();
        if (deletedRemotely) void refresh(true);
        return {
          ok: true,
          storage: deletedRemotely ? "supabase" : "local",
        };
      },
      adminFetch: (url, init) =>
        fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            "x-admin-pin": adminPin ?? "",
            ...(init?.headers ?? {}),
          },
        }),
    };
  }, [products, reviews, announcements, loading, favorites, cart, adminPin, refresh]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
