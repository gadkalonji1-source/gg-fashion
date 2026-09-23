"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { fetchRemoteProducts, resolveSupabaseConfig } from "@shared/catalog";
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
        error: "Le catalogue n’a pas pu joindre la base. Vérifiez supabaseUrl dans /config.json.",
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

  void resolveSupabaseConfig().then((config) => {
    if (!config) return;
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false },
    });
    const refresh = () => {
      void loadLiveCatalog(true);
    };
    client
      .channel("gg-catalogue-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, refresh)
      .subscribe();
  });
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
