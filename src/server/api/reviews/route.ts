import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { supabaseAdmin } from "@/lib/supabase";
import type { Review } from "@shared/types";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  const { reviews } = await readStore();
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Review>;
  if (!body.author?.trim() || !body.comment?.trim()) {
    return NextResponse.json({ error: "Nom et avis requis" }, { status: 400 });
  }
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  const review: Review = {
    id: crypto.randomUUID(),
    author: body.author.trim(),
    rating,
    comment: body.comment.trim(),
    createdAt: new Date().toISOString(),
  };
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("reviews").insert({
      id: review.id,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const store = await readStore();
    store.reviews.unshift(review);
    await writeStore(store);
  }
  return NextResponse.json({ review }, { status: 201 });
}
