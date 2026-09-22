import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/store";
import { assertAdmin, sendPushToAll } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@shared/types";
import { CATEGORIES } from "@shared/constants";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  const { products } = await readStore();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const pin = request.headers.get("x-admin-pin");
    assertAdmin(pin);
    const body = (await request.json()) as Partial<Product>;
    const categoryIds = CATEGORIES.map((c) => c.id);
    if (!body.name || !body.category || !categoryIds.includes(body.category)) {
      return NextResponse.json({ error: "Données article invalides" }, { status: 400 });
    }
    const product: Product = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      category: body.category,
      description: (body.description ?? "").trim(),
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      createdAt: new Date().toISOString(),
    };
    const sb = supabaseAdmin();
    if (sb) {
      const { error } = await sb.from("products").insert({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        images: product.images,
        created_at: product.createdAt,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const store = await readStore();
      store.products.unshift(product);
      await writeStore(store);
    }
    await sendPushToAll("Nouveau chez G.G FASHION", `${product.name} vient d’être publié.`);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const pin = request.headers.get("x-admin-pin");
    assertAdmin(pin);
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids ?? [];
    const sb = supabaseAdmin();
    if (sb) {
      const { error } = await sb.from("products").delete().in("id", ids);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const store = await readStore();
      store.products = store.products.filter((p) => !ids.includes(p.id));
      await writeStore(store);
    }
    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
