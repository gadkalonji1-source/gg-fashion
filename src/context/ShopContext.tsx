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
  deleteRemoteProducts,
  fetchRemoteAnnouncements,
  fetchRemoteProducts,
  fetchRemoteReviews,
  resolveSupabaseConfig,
  sameCatalog,
  saveRemoteAnnouncement,
  saveRemoteProduct,
  saveRemoteReview,
} from "@shared/catalog";
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

function notifyCatalogChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CATALOG_EVENT));
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
  saveAnnouncement: (draft: { title: string; message: string }) => Promise<SaveResult>;
  setAnnouncementActive: (id: string, active: boolean) => Promise<SaveResult>;
  saveReview: (draft: { author: string; comment: string; rating: number }) => Promise<SaveResult>;
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
      const [remoteProducts, remoteAnnouncements, remoteReviews] = await Promise.all([
        fetchRemoteProducts(),
        fetchRemoteAnnouncements(),
        fetchRemoteReviews(),
      ]);
      if (remoteAnnouncements) setAnnouncements(remoteAnnouncements);
      if (remoteReviews) setReviews(remoteReviews);
      if (remoteProducts) {
        applyProducts(remoteProducts);
        if (!localDirty) {
          try {
            writeLocalProducts(remoteProducts, false);
          } catch {
            // cache locale facultative
          }
        }
        return;
      }
      if (!remoteProducts && !remoteAnnouncements && !remoteReviews) {
        throw new Error("Supabase n’est pas configuré. Renseignez public/config.json.");
      }
    } catch {
      if (!productsRef.current.length) applyProducts([]);
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
      const onChange = () => {
        void refresh(true);
      };
      client
        .channel("gg-products-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, onChange)
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

        let saved: { ok: true } | { ok: false; error: string };
        try {
          saved = await saveRemoteProduct(product, adminPin ?? "");
        } catch (error) {
          saved = {
            ok: false,
            error: error instanceof Error ? error.message : "Impossible de joindre Supabase.",
          };
        }
        if (!saved.ok) {
          return { ok: false, storage: "supabase", error: saved.error };
        }

        const next = existing
          ? current.map((item) => (item.id === product.id ? product : item))
          : [product, ...current];
        productsRef.current = next;
        setProducts(next);
        try {
          writeLocalProducts(next, false);
        } catch {
          // Le catalogue distant est déjà à jour.
        }
        notifyCatalogChanged();
        void refresh(true);
        return { ok: true, storage: "supabase" };
      },
      deleteProducts: async (ids) => {
        if (!ids.length) {
          return { ok: false, storage: "local", error: "Aucun article sélectionné." };
        }
        let deleted: { ok: true } | { ok: false; error: string };
        try {
          deleted = await deleteRemoteProducts(ids, adminPin ?? "");
        } catch (error) {
          deleted = {
            ok: false,
            error: error instanceof Error ? error.message : "Impossible de joindre Supabase.",
          };
        }
        if (!deleted.ok) {
          return { ok: false, storage: "supabase", error: deleted.error };
        }
        const next = productsRef.current.filter((product) => !ids.includes(product.id));
        productsRef.current = next;
        setProducts(next);
        try {
          writeLocalProducts(next, false);
        } catch {
          // Le catalogue distant est déjà à jour.
        }
        notifyCatalogChanged();
        void refresh(true);
        return { ok: true, storage: "supabase" };
      },
      saveAnnouncement: async (draft) => {
        const title = draft.title.trim();
        const message = draft.message.trim();
        if (!title || !message) {
          return { ok: false, storage: "supabase", error: "Titre et message requis." };
        }
        const announcement: Announcement = {
          id: crypto.randomUUID(),
          title,
          message,
          active: true,
          updatedAt: new Date().toISOString(),
        };
        const saved = await saveRemoteAnnouncement(announcement, adminPin ?? "");
        if (!saved.ok) return { ok: false, storage: "supabase", error: saved.error };
        setAnnouncements((current) => [announcement, ...current]);
        void refresh(true);
        return { ok: true, storage: "supabase" };
      },
      setAnnouncementActive: async (id, active) => {
        const current = announcements.find((item) => item.id === id);
        if (!current) {
          return { ok: false, storage: "supabase", error: "Annonce introuvable." };
        }
        const saved = await saveRemoteAnnouncement(
          { ...current, active, updatedAt: new Date().toISOString() },
          adminPin ?? "",
        );
        if (!saved.ok) return { ok: false, storage: "supabase", error: saved.error };
        setAnnouncements((items) =>
          items.map((item) => (item.id === id ? { ...item, active } : item)),
        );
        void refresh(true);
        return { ok: true, storage: "supabase" };
      },
      saveReview: async (draft) => {
        const author = draft.author.trim();
        const comment = draft.comment.trim();
        if (!author || !comment) {
          return { ok: false, storage: "supabase", error: "Nom et avis requis." };
        }
        const review: Review = {
          id: crypto.randomUUID(),
          author,
          rating: Math.min(5, Math.max(1, Number(draft.rating) || 5)),
          comment,
          createdAt: new Date().toISOString(),
        };
        const saved = await saveRemoteReview(review);
        if (!saved.ok) return { ok: false, storage: "supabase", error: saved.error };
        setReviews((current) => [review, ...current]);
        void refresh(true);
        return { ok: true, storage: "supabase" };
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
