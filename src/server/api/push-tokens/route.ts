import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { supabaseAdmin } from "@/lib/supabase";
import type { PushToken } from "@shared/types";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PushToken>;
  if (!body.token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }
  const token: PushToken = {
    token: body.token,
    platform: body.platform ?? "android",
    updatedAt: new Date().toISOString(),
  };
  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("push_tokens").upsert({
      token: token.token,
      platform: token.platform,
      updated_at: token.updatedAt,
    });
  } else {
    const store = await readStore();
    store.pushTokens = [
      token,
      ...store.pushTokens.filter((t) => t.token !== token.token),
    ];
    await writeStore(store);
  }
  return NextResponse.json({ ok: true });
}
