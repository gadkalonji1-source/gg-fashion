import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Announcement, Product, PushToken, Review, StoreSnapshot } from "@shared/types";

function url() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
}
function anon() {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}
function service() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

export function isSupabaseConfigured() {
  return Boolean(url() && (service() || anon()));
}

export function supabaseAdmin(): SupabaseClient | null {
  if (!url()) return null;
  const key = service() || anon();
  if (!key) return null;
  return createClient(url(), key, { auth: { persistSession: false } });
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as Product["category"],
    description: String(row.description ?? ""),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    message: String(row.message),
    active: Boolean(row.active),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    author: String(row.author),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

export async function supabaseSnapshot(): Promise<StoreSnapshot | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const [products, announcements, reviews, pushTokens] = await Promise.all([
    sb.from("products").select("*").order("created_at", { ascending: false }),
    sb.from("announcements").select("*").order("updated_at", { ascending: false }),
    sb.from("reviews").select("*").order("created_at", { ascending: false }),
    sb.from("push_tokens").select("*"),
  ]);
  if (products.error && announcements.error) return null;
  return {
    products: (products.data ?? []).map((r) => mapProduct(r as Record<string, unknown>)),
    announcements: (announcements.data ?? []).map((r) =>
      mapAnnouncement(r as Record<string, unknown>),
    ),
    reviews: (reviews.data ?? []).map((r) => mapReview(r as Record<string, unknown>)),
    pushTokens: (pushTokens.data ?? []).map((r) => ({
      token: String((r as PushToken).token ?? (r as { token: string }).token),
      platform: ((r as { platform: PushToken["platform"] }).platform ?? "android") as PushToken["platform"],
      updatedAt: String(
        (r as { updated_at?: string }).updated_at ?? new Date().toISOString(),
      ),
    })),
  };
}
