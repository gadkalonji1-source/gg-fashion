import { createClient } from "@supabase/supabase-js";
import {
  EMBEDDED_SUPABASE_ANON_KEY,
  EMBEDDED_SUPABASE_URL,
} from "../src/lib/supabase-public-env";
import { resolveCategoryId } from "./constants";
import type { Announcement, Product, Review } from "./types";

type SupabasePublicConfig = { url: string; key: string };

function readPublicValue(inlined: string | undefined, embedded: string) {
  for (const candidate of [inlined, embedded]) {
    const value = String(candidate ?? "")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (value && value !== "undefined" && value !== "null") return value;
  }
  return "";
}

function asConfig(url?: string, key?: string): SupabasePublicConfig | null {
  let cleanUrl = String(url ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/+$/, "");
  const cleanKey = String(key ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
  return cleanUrl && cleanKey ? { url: cleanUrl, key: cleanKey } : null;
}

export function supabasePublicConfig() {
  return asConfig(
    readPublicValue(process.env.NEXT_PUBLIC_SUPABASE_URL, EMBEDDED_SUPABASE_URL),
    readPublicValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, EMBEDDED_SUPABASE_ANON_KEY),
  );
}

export function createSupabaseBrowserClient() {
  const config = supabasePublicConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false },
  });
}

export async function resolveSupabaseConfig() {
  return supabasePublicConfig();
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

function restHeaders(key: string, pin?: string): HeadersInit {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(pin ? { "x-admin-pin": pin, "Content-Type": "application/json" } : {}),
  };
}

async function restError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string; error?: string; hint?: string };
    return data.message || data.hint || data.error || `Supabase a répondu ${response.status}`;
  } catch {
    return `Supabase a répondu ${response.status}`;
  }
}

async function restFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error("Impossible de joindre Supabase. Vérifiez l’adresse du projet dans la configuration.");
  }
}

async function restSelect(table: string, order: string) {
  const config = await resolveSupabaseConfig();
  if (!config) return null;
  const response = await restFetch(
    `${config.url}/rest/v1/${table}?select=*&order=${order}`,
    { headers: restHeaders(config.key), cache: "no-store" },
  );
  if (!response.ok) throw new Error(await restError(response));
  return (await response.json()) as Array<Record<string, unknown>>;
}

export async function fetchRemoteProducts(): Promise<Product[] | null> {
  const rows = await restSelect("products", "created_at.desc");
  return rows ? rows.map(mapCatalogProduct) : null;
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    active: Boolean(row.active),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    author: String(row.author ?? ""),
    rating: Number(row.rating ?? 0),
    comment: String(row.comment ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

export async function fetchRemoteAnnouncements(): Promise<Announcement[] | null> {
  const rows = await restSelect("announcements", "updated_at.desc");
  return rows ? rows.map(mapAnnouncement) : null;
}

export async function fetchRemoteReviews(): Promise<Review[] | null> {
  const rows = await restSelect("reviews", "created_at.desc");
  return rows ? rows.map(mapReview) : null;
}

async function restMutate(url: string, init: RequestInit) {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return { ok: false as const, error: await restError(response) };
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "Impossible de joindre Supabase. Vérifiez l’adresse du projet dans la configuration.",
    };
  }
}

export async function saveRemoteProduct(product: Product, pin: string) {
  const config = await resolveSupabaseConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase n’est pas configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  return restMutate(`${config.url}/rest/v1/products?on_conflict=id`, {
    method: "POST",
    headers: {
      ...restHeaders(config.key, pin),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      images: product.images,
      created_at: product.createdAt,
    }),
  });
}

export async function deleteRemoteProducts(ids: string[], pin: string) {
  const config = await resolveSupabaseConfig();
  if (!config || !ids.length) {
    return { ok: false as const, error: "Supabase n’est pas configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  const filter = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
  return restMutate(`${config.url}/rest/v1/products?id=in.(${filter})`, {
    method: "DELETE",
    headers: restHeaders(config.key, pin),
  });
}

export async function saveRemoteAnnouncement(announcement: Announcement, pin: string) {
  const config = await resolveSupabaseConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase n’est pas configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  return restMutate(`${config.url}/rest/v1/announcements?on_conflict=id`, {
    method: "POST",
    headers: {
      ...restHeaders(config.key, pin),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      active: announcement.active,
      updated_at: announcement.updatedAt,
    }),
  });
}

export async function saveRemoteReview(review: Review) {
  const config = await resolveSupabaseConfig();
  if (!config) {
    return { ok: false as const, error: "Supabase n’est pas configuré. Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  return restMutate(`${config.url}/rest/v1/reviews`, {
    method: "POST",
    headers: {
      ...restHeaders(config.key),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: review.id,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
    }),
  });
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
