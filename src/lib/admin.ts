import { BRAND } from "@shared/constants";
import { supabaseAdmin } from "./supabase";
import { readStore, writeStore } from "./store";
import type { StoreSnapshot } from "@shared/types";

export function assertAdmin(pin: string | null) {
  if (pin !== BRAND.adminPin) {
    const error = new Error("Code PIN administrateur invalide");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
}

export async function mutateStore(
  pin: string | null,
  updater: (current: StoreSnapshot) => StoreSnapshot | Promise<StoreSnapshot>,
) {
  assertAdmin(pin);
  const current = await readStore();
  const next = await updater(current);
  const sb = supabaseAdmin();
  if (sb) {
    return next;
  }
  await writeStore(next);
  return next;
}

export async function sendPushToAll(title: string, body: string) {
  const { pushTokens } = await readStore();
  const tokens = pushTokens.map((t) => t.token).filter(Boolean);
  if (!tokens.length) {
    return { sent: 0 };
  }
  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data: { brand: BRAND.name },
  }));
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(messages),
  });
  return { sent: tokens.length, status: res.status };
}
