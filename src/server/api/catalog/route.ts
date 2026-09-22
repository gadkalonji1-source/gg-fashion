import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  const store = await readStore();
  const activeAnnouncement =
    store.announcements.find((a) => a.active) ?? null;
  return NextResponse.json({
    products: store.products,
    announcements: store.announcements,
    activeAnnouncement,
    reviews: store.reviews,
  });
}
