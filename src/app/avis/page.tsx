"use client";

import { FormEvent, useState } from "react";
import { useShop } from "@/context/ShopContext";

export default function ReviewsPage() {
  const { reviews, refresh } = useShop();
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, comment, rating }),
    });
    if (!res.ok) {
      setStatus("Impossible d’envoyer l’avis.");
      return;
    }
    setAuthor("");
    setComment("");
    setRating(5);
    setStatus("Merci pour votre mot.");
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
        Témoignages
      </p>
      <h1 className="mt-2 font-serif text-5xl italic">Avis clientes</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-[var(--gold)]/20 bg-white p-6 shadow-[0_10px_30px_rgba(26,26,26,0.05)]"
            >
              <p className="text-[var(--accent)]">{"★".repeat(r.rating)}</p>
              <p className="mt-3 text-sm leading-7">{r.comment}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--ink)]/50">
                {r.author}
              </p>
            </article>
          ))}
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-[var(--gold)]/20 bg-[var(--powder)] p-6 shadow-sm"
        >
          <h2 className="font-serif text-2xl">Laisser un avis</h2>
          <input
            required
            placeholder="Votre nom"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} étoile{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <textarea
            required
            rows={5}
            placeholder="Votre commentaire"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="gold-btn w-full" type="submit">
            Publier
          </button>
          {status && <p className="text-sm italic">{status}</p>}
        </form>
      </div>
    </div>
  );
}
