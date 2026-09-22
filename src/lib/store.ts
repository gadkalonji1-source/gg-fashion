import { promises as fs } from "fs";
import path from "path";
import { SEED } from "@shared/seed";
import type { StoreSnapshot } from "@shared/types";
import { isSupabaseConfigured, supabaseSnapshot } from "./supabase";

const dataPath = path.join(process.cwd(), "data", "db.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify(SEED, null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreSnapshot> {
  if (isSupabaseConfigured()) {
    const remote = await supabaseSnapshot();
    if (remote) return remote;
  }
  await ensureFile();
  const raw = await fs.readFile(dataPath, "utf8");
  const parsed = JSON.parse(raw) as StoreSnapshot;
  return {
    products: parsed.products ?? [],
    announcements: parsed.announcements ?? [],
    reviews: parsed.reviews ?? [],
    pushTokens: parsed.pushTokens ?? [],
  };
}

export async function writeStore(next: StoreSnapshot) {
  if (isSupabaseConfigured()) {
    throw new Error("Écriture fichier locale désactivée : Supabase est configuré.");
  }
  await ensureFile();
  await fs.writeFile(dataPath, JSON.stringify(next, null, 2), "utf8");
}
