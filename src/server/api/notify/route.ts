import { NextResponse } from "next/server";
import { assertAdmin, sendPushToAll } from "@/lib/admin";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  try {
    const pin = request.headers.get("x-admin-pin");
    assertAdmin(pin);
    const body = (await request.json()) as { title?: string; body?: string };
    const result = await sendPushToAll(
      body.title ?? "G.G FASHION",
      body.body ?? "Nouvelle actualité boutique.",
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
