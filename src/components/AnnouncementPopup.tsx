"use client";

import { useShop } from "@/context/ShopContext";
import { useEffect, useState } from "react";

export function AnnouncementPopup() {
  const { activeAnnouncement } = useShop();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!activeAnnouncement) {
      setOpen(false);
      return;
    }
    const key = `gg-popup-${activeAnnouncement.id}`;
    if (sessionStorage.getItem(key)) return;
    setOpen(true);
  }, [activeAnnouncement]);

  if (!activeAnnouncement || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="max-w-md rounded-2xl border border-[var(--gold)]/35 bg-white p-8 text-center shadow-xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
          G.G FASHION
        </p>
        <h2 className="mt-3 font-serif text-2xl">{activeAnnouncement.title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--ink)]/75">
          {activeAnnouncement.message}
        </p>
        <button
          className="gold-btn mt-6"
          onClick={() => {
            sessionStorage.setItem(`gg-popup-${activeAnnouncement.id}`, "1");
            setOpen(false);
          }}
        >
          Découvrir
        </button>
      </div>
    </div>
  );
}
