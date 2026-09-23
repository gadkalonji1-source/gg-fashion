"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient, fetchRemoteProducts } from "@shared/catalog";
import type { Product } from "@shared/types";

const CATALOG_EVENT = "gg-products-changed";

type LiveState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fromRemote: boolean;
};

let shared: LiveState = {
  products: [],
  loading: true,
  error: null,
  fromRemote: false,
};
const listeners = new Set<() => void>();
let started = false;

function emit(next: Partial<LiveState>) {
  shared = { ...shared, ...next };
  listeners.forEach((listener) => listener());
}

async function loadLiveCatalog(silent = false) {
  if (!silent && !shared.fromRemote) emit({ loading: true });
  try {
    const remote = await fetchRemoteProducts();
    if (remote) {
      emit({
        products: remote,
        loading: false,
        error: null,
        fromRemote: true,
      });
      return;
    }
    if (!shared.fromRemote) {
      emit({
        products: [],
        loading: false,
        error: "Supabase n’est pas configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        fromRemote: false,
      });
    }
  } catch (error) {
    if (!shared.fromRemote) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Impossible de charger le catalogue en direct.";
      emit({
        products: [],
        loading: false,
        error: message,
        fromRemote: false,
      });
    }
  }
}

function startLiveCatalog() {
  if (started || typeof window === "undefined") return;
  started = true;
  void loadLiveCatalog();

  const onRefresh = () => {
    void loadLiveCatalog(true);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") void loadLiveCatalog(true);
  };

  window.addEventListener("focus", onRefresh);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener(CATALOG_EVENT, onRefresh);
  window.setInterval(() => {
    if (document.visibilityState === "visible") void loadLiveCatalog(true);
  }, 8000);

  const client = createSupabaseBrowserClient();
  if (client) {
    const refresh = () => {
      void loadLiveCatalog(true);
    };
    client
      .channel("gg-catalogue-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, refresh)
      .subscribe();
  }
}

export function useLiveProducts() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1);
    listeners.add(listener);
    startLiveCatalog();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    products: shared.products,
    loading: shared.loading && shared.products.length === 0,
    error: shared.error,
    refresh: loadLiveCatalog,
  };
}
