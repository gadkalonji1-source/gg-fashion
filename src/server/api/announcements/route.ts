import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { assertAdmin, sendPushToAll } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import type { Announcement } from "@shared/types";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  const { announcements } = await readStore();
  const active = announcements.find((a) => a.active) ?? null;
  return NextResponse.json({ announcements, active });
}

export async function POST(request: Request) {
  try {
    const pin = request.headers.get("x-admin-pin");
    assertAdmin(pin);
    const body = (await request.json()) as Partial<Announcement>;
    if (!body.title || !body.message) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }
    const announcement: Announcement = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      message: body.message.trim(),
      active: Boolean(body.active),
      updatedAt: new Date().toISOString(),
    };
    const sb = supabaseAdmin();
    if (sb) {
      const { error } = await sb.from("announcements").insert({
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        active: announcement.active,
        updated_at: announcement.updatedAt,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const store = await readStore();
      store.announcements.unshift(announcement);
      await writeStore(store);
    }
    if (announcement.active) {
      await sendPushToAll(announcement.title, announcement.message);
    }
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const pin = request.headers.get("x-admin-pin");
    assertAdmin(pin);
    const body = (await request.json()) as Partial<Announcement> & { id: string };
    if (!body.id) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }
    const sb = supabaseAdmin();
    const now = new Date().toISOString();
    if (sb) {
      const patch: Record<string, unknown> = { updated_at: now };
      if (body.title !== undefined) patch.title = body.title;
      if (body.message !== undefined) patch.message = body.message;
      if (body.active !== undefined) patch.active = body.active;
      const { error } = await sb.from("announcements").update(patch).eq("id", body.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const store = await readStore();
      store.announcements = store.announcements.map((a) =>
        a.id === body.id
          ? {
              ...a,
              title: body.title ?? a.title,
              message: body.message ?? a.message,
              active: body.active ?? a.active,
              updatedAt: now,
            }
          : a,
      );
      await writeStore(store);
    }
    if (body.active) {
      await sendPushToAll(
        body.title ?? "Annonce G.G FASHION",
        body.message ?? "Une nouvelle annonce est disponible.",
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
