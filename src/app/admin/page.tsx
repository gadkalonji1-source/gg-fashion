"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@shared/constants";
import { useShop } from "@/context/ShopContext";
import { filesToCompressedDataUrls } from "@/lib/images";
import type { CategoryId, Product } from "@shared/types";

export default function AdminPage() {
  const {
    isAdmin,
    unlockAdmin,
    lockAdmin,
    products,
    announcements,
    saveProduct,
    deleteProducts,
    adminFetch,
    refresh,
  } = useShop();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"articles" | "annonces">("articles");
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [readingPhotos, setReadingPhotos] = useState(false);
  const [status, setStatus] = useState("");
  const [mounted, setMounted] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  function resetArticleForm() {
    setEditingId(null);
    setName("");
    setCategory(CATEGORIES[0].id);
    setDescription("");
    setImages([]);
    setFileKey((key) => key + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setDescription(product.description);
    setImages([...product.images]);
    setStatus(`Modification de « ${product.name} ».`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onPin(e: FormEvent) {
    e.preventDefault();
    const ok = await unlockAdmin(pin);
    setError(ok ? "" : "Code secret incorrect.");
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setReadingPhotos(true);
    setStatus("");
    try {
      const urls = await filesToCompressedDataUrls(files);
      if (!urls.length) {
        setStatus("Aucune image valide n’a pu être ajoutée.");
        return;
      }
      setImages((prev) => [...prev, ...urls]);
      setStatus(`${urls.length} photo(s) ajoutée(s).`);
    } catch {
      setStatus("Impossible de lire les photos sélectionnées.");
    } finally {
      setReadingPhotos(false);
      setFileKey((key) => key + 1);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setImages((prev) => prev.filter((_, current) => current !== index));
    setStatus("Photo retirée.");
  }

  async function publishArticle(e: FormEvent) {
    e.preventDefault();
    if (readingPhotos) {
      setStatus("Patientez, les photos sont encore en cours de chargement.");
      return;
    }
    if (!name.trim()) {
      setStatus("Le nom de l’article est obligatoire.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const result = await saveProduct({
        id: editingId ?? undefined,
        name,
        category,
        description,
        images,
      });
      if (!result.ok) {
        setStatus(result.error ?? "Impossible d’enregistrer l’article.");
        return;
      }
      const verb = editingId ? "mis à jour" : "publié";
      setStatus(
        result.storage === "supabase"
          ? `Article ${verb}.`
          : `Article ${verb} et visible dans le catalogue.`,
      );
      resetArticleForm();
    } catch {
      setStatus("Impossible d’enregistrer l’article.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProducts(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    try {
      const result = await deleteProducts(ids);
      if (!result.ok) {
        setStatus(result.error ?? "Impossible de supprimer la sélection.");
        return;
      }
      setSelected([]);
      if (editingId && ids.includes(editingId)) resetArticleForm();
      setStatus(
        ids.length > 1 ? "Articles supprimés du catalogue." : "Article supprimé du catalogue.",
      );
    } catch {
      setStatus("Impossible de supprimer la sélection.");
    } finally {
      setBusy(false);
    }
  }

  async function addAnnouncement(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await adminFetch("/api/announcements", {
      method: "POST",
      body: JSON.stringify({ title, message, active: true }),
    });
    setTitle("");
    setMessage("");
    setBusy(false);
    await refresh();
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    await adminFetch("/api/announcements", {
      method: "PATCH",
      body: JSON.stringify({ id, active }),
    });
    await refresh();
  }

  if (!mounted) {
    return <div className="py-24 text-center italic">Chargement…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-5 py-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Espace privé
        </p>
        <h1 className="mt-2 font-serif text-4xl italic">Administration</h1>
        <form onSubmit={onPin} className="mt-8 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder="Code secret PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button className="gold-btn w-full" type="submit">
            Entrer
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl italic">Dashboard</h1>
        <button className="text-xs uppercase tracking-[0.16em]" onClick={lockAdmin}>
          Déconnexion
        </button>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border ${tab === "articles" ? "bg-[var(--accent)] border-[var(--gold)] text-white" : "border-[var(--gold)]/40"}`}
          onClick={() => setTab("articles")}
        >
          Articles
        </button>
        <button
          className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border ${tab === "annonces" ? "bg-[var(--accent)] border-[var(--gold)] text-white" : "border-[var(--gold)]/40"}`}
          onClick={() => setTab("annonces")}
        >
          Gestion des annonces
        </button>
      </div>

      {tab === "articles" && (
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={publishArticle} className="space-y-3 bg-[var(--powder)] p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-2xl">
                {editingId ? "Modifier l’article" : "Ajouter un article"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]"
                  onClick={() => {
                    resetArticleForm();
                    setStatus("");
                  }}
                >
                  Nouveau
                </button>
              )}
            </div>
            <input
              required
              placeholder="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <textarea
              rows={4}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-[var(--ink)]/55">
                Photos de l’article
              </span>
              <input
                key={fileKey}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void addPhotos(e.target.files)}
              />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {images.map((src, index) => (
                  <div key={`${src.slice(0, 48)}-${index}`} className="relative overflow-hidden rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-[3/4] w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Supprimer cette photo"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-xs text-white"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-[var(--ink)]/50">
              {readingPhotos
                ? "Chargement des photos…"
                : `${images.length} image(s) — cliquez sur × pour retirer une photo.`}
            </p>
            {status && <p className="text-sm text-[var(--accent)]">{status}</p>}
            <button className="gold-btn w-full" disabled={busy || readingPhotos} type="submit">
              {busy ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Publier l’article"}
            </button>
          </form>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Catalogue</h2>
              <button
                className="ghost-btn !py-2"
                disabled={!selected.length || busy}
                onClick={() => void removeProducts(selected)}
              >
                Supprimer la sélection ({selected.length})
              </button>
            </div>
            <ul className="divide-y divide-[var(--powder-deep)] overflow-hidden rounded-2xl border border-[var(--gold)]/20 bg-white shadow-sm">
              {products.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <input
                    className="w-auto"
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-12 w-10 object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-[var(--ink)]/50">
                      {CATEGORIES.find((c) => c.id === p.category)?.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.12em] text-[var(--accent)]"
                    onClick={() => startEdit(p)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.12em]"
                    onClick={() => void removeProducts([p.id])}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "annonces" && (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <form onSubmit={addAnnouncement} className="space-y-3 bg-[var(--powder)] p-6">
            <h2 className="font-serif text-2xl">Publier une annonce</h2>
            <input required placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              required
              rows={4}
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="gold-btn w-full" disabled={busy} type="submit">
              Publier et notifier
            </button>
          </form>
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-[var(--gold)]/20 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl">{a.title}</p>
                    <p className="mt-2 text-sm">{a.message}</p>
                  </div>
                  <button
                    className={`text-[10px] uppercase tracking-[0.16em] ${a.active ? "text-[var(--accent)]" : "text-[var(--ink)]/40"}`}
                    onClick={() => toggleAnnouncement(a.id, !a.active)}
                  >
                    {a.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
