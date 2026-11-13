"use client";

import { useState } from "react";
import type { KitDetails, KitImage } from "@/domain/kit/types";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

async function uploadFile(file: File): Promise<KitImage> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Качването се провали.");
  }
  return { url: data.url, alt: file.name };
}

export function KitEditForm({ variantId, initialKit }: { variantId: string; initialKit: KitDetails }) {
  const [priceBgn, setPriceBgn] = useState(initialKit.priceBgn !== null ? String(initialKit.priceBgn) : "");
  const [compareAtPriceBgn, setCompareAtPriceBgn] = useState(
    initialKit.compareAtPriceBgn !== null ? String(initialKit.compareAtPriceBgn) : "",
  );
  const [coverImage, setCoverImage] = useState<KitImage | null>(initialKit.coverImage);
  const [gallery, setGallery] = useState<KitImage[]>(initialKit.gallery);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploadingCover(true);
    try {
      setCoverImage(await uploadFile(file));
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Качването се провали." });
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const uploaded = await Promise.all(files.map(uploadFile));
      setGallery((current) => [...current, ...uploaded]);
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Качването се провали." });
    } finally {
      setIsUploadingGallery(false);
    }
  }

  function removeGalleryImage(index: number) {
    setGallery((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch(`/api/admin/kits/${variantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceBgn: priceBgn.trim() === "" ? null : Number(priceBgn),
        compareAtPriceBgn: compareAtPriceBgn.trim() === "" ? null : Number(compareAtPriceBgn),
        coverImage,
        gallery,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setSaveState({ status: "error", message: data.error ?? "Записът се провали." });
      return;
    }
    setSaveState({ status: "saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-800">Текуща цена (лв.)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceBgn}
            onChange={(event) => setPriceBgn(event.target.value)}
            placeholder="предстои да се зададе"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-800">Стандартна цена (лв.)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={compareAtPriceBgn}
            onChange={(event) => setCompareAtPriceBgn(event.target.value)}
            placeholder="незадължително"
            className={inputClasses}
          />
          <span className="text-xs text-ink-700">
            Зачертана цена до текущата. Задай я само ако текущата наистина е намаление.
          </span>
        </label>
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Заглавна снимка</span>
        <div className="mt-2 flex items-start gap-4">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-lavender-300 bg-lavender-50">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
              <img src={coverImage.url} alt={coverImage.alt} className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-lavender-600">Няма снимка</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer text-sm font-medium text-burgundy-700 underline underline-offset-4">
              {isUploadingCover ? "Качване…" : "Качи заглавна снимка"}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={isUploadingCover} />
            </label>
            {coverImage ? (
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="text-left text-sm text-ink-700 underline underline-offset-4"
              >
                Премахни заглавната снимка
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Галерия</span>
        <div className="mt-2 flex flex-wrap gap-4">
          {gallery.map((image, index) => (
            <div key={image.url} className="relative h-28 w-28 overflow-hidden rounded-xl border border-lavender-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image */}
              <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(index)}
                aria-label="Премахни снимката"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper-50/90 text-ink-900 shadow"
              >
                ×
              </button>
            </div>
          ))}
          <label className="flex h-28 w-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-lavender-300 bg-lavender-50 text-center text-sm font-medium text-burgundy-700">
            {isUploadingGallery ? "Качване…" : "+ Добави"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              disabled={isUploadingGallery}
            />
          </label>
        </div>
      </div>

      {saveState.status === "error" ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {saveState.message}
        </p>
      ) : null}
      {saveState.status === "saved" ? <p className="text-sm text-sage-700">Запазено.</p> : null}

      <Button type="submit" disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Запазване…" : "Запази"}
      </Button>
    </form>
  );
}
