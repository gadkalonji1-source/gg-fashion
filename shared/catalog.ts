import { resolveCategoryId } from "./constants";
import type { Product } from "./types";

type SupabasePublicConfig = { url: string; key: string };

let runtimeConfig: SupabasePublicConfig | null | undefined;
let runtimeConfigPromise: Promise<SupabasePublicConfig | null> | null = null;

function asConfig(url?: string, key?: string): SupabasePublicConfig | null {
  const cleanUrl = String(url ?? "").replace(/\/$/, "").trim();
  const cleanKey = String(key ?? "").trim();
  return cleanUrl && cleanKey ? { url: cleanUrl, key: cleanKey } : null;
}

export function supabasePublicConfig() {
  return asConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function resolveSupabaseConfig() {
  if (runtimeConfig !== undefined) return runtimeConfig;
  if (runtimeConfigPromise) return runtimeConfigPromise;

  runtimeConfigPromise = (async () => {
    const fromEnv = supabasePublicConfig();
    if (fromEnv) {
      runtimeConfig = fromEnv;
      return fromEnv;
    }
    if (typeof window === "undefined") {
      runtimeConfig = null;
      return null;
    }
    try {
      const response = await fetch("/config.json", { cache: "no-store" });
      if (!response.ok) {
        runtimeConfig = null;
        return null;
      }
      const data = (await response.json()) as Record<string, string>;
      runtimeConfig = asConfig(
        data.supabaseUrl || data.NEXT_PUBLIC_SUPABASE_URL,
        data.supabaseAnonKey || data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );
      return runtimeConfig;
    } catch {
      runtimeConfig = null;
      return null;
    }
  })();

  return runtimeConfigPromise;
}

function mapImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      return [value];
    }
  }
  return [];
}

export function mapCatalogProduct(row: Record<string, unknown>): Product {
  const rawCategory = String(row.category ?? "");
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: (resolveCategoryId(rawCategory) ?? rawCategory) as Product["category"],
    description: String(row.description ?? ""),
    images: mapImages(row.images),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

export async function fetchRemoteProducts(): Promise<Product[] | null> {
  const config = await resolveSupabaseConfig();
  if (!config) return null;

  const response = await fetch(
    `${config.url}/rest/v1/products?select=*&order=created_at.desc`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Supabase catalog unavailable");
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map(mapCatalogProduct);
}

export function mergeCatalog(remote: Product[], local: Product[] | null, dirty: boolean) {
  if (!local?.length) return remote;
  if (!dirty) return remote;

  const localById = new Map(local.map((product) => [product.id, product]));
  const remoteIds = new Set(remote.map((product) => product.id));
  const pending = local.filter((product) => !remoteIds.has(product.id));
  const mergedRemote = remote.map((product) => localById.get(product.id) ?? product);
  return [...pending, ...mergedRemote].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sameCatalog(left: Product[], right: Product[]) {
  if (left.length !== right.length) return false;
  return left.every((product, index) => {
    const other = right[index];
    return (
      product.id === other.id &&
      product.name === other.name &&
      product.category === other.category &&
      product.description === other.description &&
      product.images.join("|") === other.images.join("|")
    );
  });
}
