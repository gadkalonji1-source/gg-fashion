"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  fetchRemoteProducts,
  mergeCatalog,
  resolveSupabaseConfig,
} from "@shared/catalog";
import type { Product } from "@shared/types";

const CATALOG_EVENT = "gg-products-changed";
const LOCAL_PRODUCTS_KEY = "gg-admin-products";
const LOCAL_PRODUCTS_DIRTY_KEY = "gg-admin-products-dirty";

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

function pendingLocalProducts(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(LOCAL_PRODUCTS_DIRTY_KEY) !== "1") return null;
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function loadLiveCatalog(silent = false) {
  if (!silent && !shared.fromRemote) emit({ loading: true });
  try {
    const remote = await fetchRemoteProducts();
    if (remote) {
      emit({
        products: mergeCatalog(remote, pendingLocalProducts(), true),
        loading: false,
        error: null,
        fromRemote: true,
      });
      return;
    }
    if (!shared.fromRemote) {
      emit({
        products: pendingLocalProducts() ?? shared.products,
        loading: false,
        error: "Le catalogue n’a pas pu joindre la base. Vérifiez supabaseUrl dans /config.json.",
        fromRemote: false,
      });
    }
  } catch {
    if (!shared.fromRemote) {
      emit({
        products: pendingLocalProducts() ?? shared.products,
        loading: false,
        error: "Impossible de charger le catalogue en direct.",
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
    client
      .channel("gg-catalogue-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          void loadLiveCatalog(true);
        },
      )
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
