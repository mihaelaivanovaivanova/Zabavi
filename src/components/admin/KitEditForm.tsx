"use client";

import { useRef, useState } from "react";
import type { IllustrationContent, KitDetails, KitImage } from "@/domain/kit/types";
import type { ProductVariant } from "@/domain/product/types";
import { Button } from "@/components/ui/Button";
import { InputField, inputClasses } from "@/components/ui/Field";
import { product } from "@/config/site";
import { clampFocalPercent, moveItemTo } from "@/lib/listOrder";

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

function ListEditor({
  label,
  helperText,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  helperText?: string;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  function updateItem(index: number, value: string) {
    onChange(items.map((item, i) => (i === index ? value : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <span className="text-sm font-medium text-ink-800">{label}</span>
      {helperText ? <p className="text-xs text-ink-700">{helperText}</p> : null}
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder={placeholder}
              className={inputClasses}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label="Премахни елемента"
              className="shrink-0 rounded-lg border border-lavender-200 px-3 text-ink-700 hover:border-burgundy-400 hover:text-burgundy-700"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-sm font-medium text-burgundy-700 underline underline-offset-4"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function FocalPointPicker({
  image,
  onChange,
}: {
  image: KitImage;
  onChange: (focal: { focalX: number; focalY: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focalX = image.focalX ?? 50;
  const focalY = image.focalY ?? 50;

  function updateFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onChange({
      focalX: clampFocalPercent(((event.clientX - rect.left) / rect.width) * 100),
      focalY: clampFocalPercent(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromEvent(event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return;
    updateFromEvent(event);
  }

  return (
    <div className="mt-2 flex flex-wrap items-start gap-4 rounded-xl border border-lavender-200 bg-lavender-50 p-3">
      <div>
        <p className="mb-1 text-xs font-medium text-ink-700">Кликни или плъзни, за да избереш коя част да се вижда</p>
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="relative h-40 w-40 touch-none overflow-hidden rounded-lg border border-lavender-300 bg-ink-900/5 cursor-crosshair"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image */}
          <img src={image.url} alt={image.alt} className="h-full w-full object-contain" draggable={false} />
          <div
            aria-hidden="true"
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper-50 bg-burgundy-700 shadow"
            style={{ left: `${focalX}%`, top: `${focalY}%` }}
          />
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-ink-700">Преглед на изрязването</p>
        <div className="h-40 w-40 overflow-hidden rounded-lg border border-lavender-300">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image */}
          <img
            src={image.url}
            alt={image.alt}
            className="h-full w-full object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        </div>
      </div>
    </div>
  );
}

async function uploadRawFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Качването се провали.");
  }
  return data.url;
}

async function uploadFile(file: File): Promise<KitImage> {
  const url = await uploadRawFile(file);
  return { url, alt: file.name };
}

export function KitEditForm({
  variantId,
  variant,
  initialKit,
}: {
  variantId: string;
  variant: ProductVariant;
  initialKit: KitDetails;
}) {
  const [priceEur, setPriceEur] = useState(initialKit.priceEur !== null ? String(initialKit.priceEur) : "");
  const [compareAtPriceEur, setCompareAtPriceEur] = useState(
    initialKit.compareAtPriceEur !== null ? String(initialKit.compareAtPriceEur) : "",
  );
  const [coverImage, setCoverImage] = useState<KitImage | null>(initialKit.coverImage);
  const [gallery, setGallery] = useState<KitImage[]>(initialKit.gallery);
  const [illustrationImages, setIllustrationImages] = useState<(KitImage | null)[]>(
    initialKit.illustrationImages ?? product.illustrations.map(() => null),
  );
  const [illustrationContent, setIllustrationContent] = useState<IllustrationContent[]>(
    initialKit.illustrationContent ??
      product.illustrations.map((illustration) => ({ title: illustration.title, description: illustration.description })),
  );
  const [boxContentsVideoUrl, setBoxContentsVideoUrl] = useState<string | null>(
    initialKit.boxContentsVideoUrl ?? null,
  );
  const [boxContentsVideoThumbnail, setBoxContentsVideoThumbnail] = useState<KitImage | null>(
    initialKit.boxContentsVideoThumbnail ?? null,
  );
  const [label, setLabel] = useState(initialKit.label ?? variant.label);
  const [intro, setIntro] = useState(initialKit.intro ?? variant.intro ?? "");
  const [badge, setBadge] = useState(initialKit.badge ?? variant.badge ?? "");
  const [contents, setContents] = useState<string[]>(initialKit.contents ?? variant.contents ?? []);
  const [bonus, setBonus] = useState<string[]>(initialKit.bonus ?? variant.bonus ?? []);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadingIllustrationIndex, setUploadingIllustrationIndex] = useState<number | null>(null);
  const [isUploadingBoxVideo, setIsUploadingBoxVideo] = useState(false);
  const [isUploadingBoxVideoThumbnail, setIsUploadingBoxVideoThumbnail] = useState(false);
  const [activePositioner, setActivePositioner] = useState<"cover" | number | null>(null);
  const [activeIllustrationPositioner, setActiveIllustrationPositioner] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    setActivePositioner(null);
  }

  function handleGalleryDragStart(index: number, event: React.DragEvent) {
    setActivePositioner(null);
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleGalleryDragOver(index: number, event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  }

  function handleGalleryDrop(index: number, event: React.DragEvent) {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setGallery((current) => moveItemTo(current, dragIndex, index));
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleGalleryDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function updateCoverFocalPoint(focal: { focalX: number; focalY: number }) {
    setCoverImage((current) => (current ? { ...current, ...focal } : current));
  }

  function updateGalleryFocalPoint(index: number, focal: { focalX: number; focalY: number }) {
    setGallery((current) => current.map((image, i) => (i === index ? { ...image, ...focal } : image)));
  }

  async function handleIllustrationUpload(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingIllustrationIndex(index);
    try {
      const uploaded = await uploadFile(file);
      setIllustrationImages((current) => current.map((image, i) => (i === index ? uploaded : image)));
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Качването се провали." });
    } finally {
      setUploadingIllustrationIndex(null);
    }
  }

  function removeIllustrationImage(index: number) {
    setIllustrationImages((current) => current.map((image, i) => (i === index ? null : image)));
    setActiveIllustrationPositioner(null);
  }

  function updateIllustrationFocalPoint(index: number, focal: { focalX: number; focalY: number }) {
    setIllustrationImages((current) =>
      current.map((image, i) => (i === index && image ? { ...image, ...focal } : image)),
    );
  }

  function updateIllustrationContent(index: number, patch: Partial<IllustrationContent>) {
    setIllustrationContent((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleBoxVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploadingBoxVideo(true);
    try {
      setBoxContentsVideoUrl(await uploadRawFile(file));
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Качването се провали." });
    } finally {
      setIsUploadingBoxVideo(false);
    }
  }

  async function handleBoxVideoThumbnailUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploadingBoxVideoThumbnail(true);
    try {
      setBoxContentsVideoThumbnail(await uploadFile(file));
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Качването се провали." });
    } finally {
      setIsUploadingBoxVideoThumbnail(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState({ status: "saving" });

    const response = await fetch(`/api/admin/kits/${variantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceEur: priceEur.trim() === "" ? null : Number(priceEur),
        compareAtPriceEur: compareAtPriceEur.trim() === "" ? null : Number(compareAtPriceEur),
        coverImage,
        gallery,
        label,
        intro,
        badge,
        contents: contents.map((item) => item.trim()).filter((item) => item !== ""),
        bonus: bonus.map((item) => item.trim()).filter((item) => item !== ""),
        illustrationImages,
        illustrationContent,
        boxContentsVideoUrl,
        boxContentsVideoThumbnail,
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
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-800">Име на комплекта</span>
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-800">Въвеждащ текст</span>
        <input
          type="text"
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          placeholder="незадължително"
          className={inputClasses}
        />
        <span className="text-xs text-ink-700">Показва се над списъка „Получаваш“ в картата на комплекта.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-800">Етикет (бадж)</span>
        <input
          type="text"
          value={badge}
          onChange={(event) => setBadge(event.target.value)}
          placeholder="напр. Лимитирано — незадължително"
          className={inputClasses}
        />
      </label>

      <ListEditor
        label="Получаваш — съдържание на комплекта"
        items={contents}
        onChange={setContents}
        addLabel="+ Добави елемент"
        placeholder="напр. 2 бр. четки за акварел"
      />

      <ListEditor
        label="Бонус"
        helperText="Незадължително — остави празно, ако комплектът няма бонус елементи."
        items={bonus}
        onChange={setBonus}
        addLabel="+ Добави бонус елемент"
        placeholder="напр. QR код с видео инструкции"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-800">Текуща цена (€)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceEur}
            onChange={(event) => setPriceEur(event.target.value)}
            placeholder="предстои да се зададе"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-800">Стандартна цена (€)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={compareAtPriceEur}
            onChange={(event) => setCompareAtPriceEur(event.target.value)}
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
              <img
                src={coverImage.url}
                alt={coverImage.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: `${coverImage.focalX ?? 50}% ${coverImage.focalY ?? 50}%` }}
              />
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
              <>
                <button
                  type="button"
                  onClick={() => setActivePositioner(activePositioner === "cover" ? null : "cover")}
                  className="text-left text-sm font-medium text-burgundy-700 underline underline-offset-4"
                >
                  {activePositioner === "cover" ? "Скрий позиционирането" : "Позиционирай"}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="text-left text-sm text-ink-700 underline underline-offset-4"
                >
                  Премахни заглавната снимка
                </button>
              </>
            ) : null}
          </div>
        </div>
        {coverImage && activePositioner === "cover" ? (
          <FocalPointPicker image={coverImage} onChange={updateCoverFocalPoint} />
        ) : null}
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Галерия</span>
        <p className="text-xs text-ink-700">Редът тук определя реда на снимките в галерията на сайта.</p>
        <div className="mt-2 flex flex-wrap items-start gap-4">
          {gallery.map((image, index) => (
            <div
              key={image.url}
              draggable
              onDragStart={(event) => handleGalleryDragStart(index, event)}
              onDragOver={(event) => handleGalleryDragOver(index, event)}
              onDrop={(event) => handleGalleryDrop(index, event)}
              onDragEnd={handleGalleryDragEnd}
              title="Плъзни, за да пренаредиш"
              className={`w-28 cursor-grab transition-opacity active:cursor-grabbing ${
                dragIndex === index ? "opacity-40" : ""
              } ${dragOverIndex === index && dragIndex !== index ? "rounded-xl ring-2 ring-burgundy-500" : ""}`}
            >
              <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-lavender-200">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image */}
                <img
                  src={image.url}
                  alt={image.alt}
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper-50/90 text-ink-900 shadow"
                >
                  ⠿
                </span>
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  aria-label="Премахни снимката"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper-50/90 text-ink-900 shadow"
                >
                  ×
                </button>
              </div>
              <div className="mt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActivePositioner(activePositioner === index ? null : index)}
                  aria-label="Позиционирай снимката"
                  className="text-xs font-medium text-burgundy-700 underline underline-offset-4"
                >
                  Позиционирай
                </button>
              </div>
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
        {typeof activePositioner === "number" && gallery[activePositioner] ? (
          <FocalPointPicker
            image={gallery[activePositioner]}
            onChange={(focal) => updateGalleryFocalPoint(activePositioner, focal)}
          />
        ) : null}
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Илюстрации в комплекта</span>
        <p className="text-xs text-ink-700">
          Незадължително — без качена снимка картата показва placeholder кутия на сайта.
        </p>
        <div className="mt-2 space-y-3">
          {product.illustrations.map((illustration, index) => {
            const image = illustrationImages[index];
            return (
              <div key={illustration.title}>
                <div className="flex items-center gap-4 rounded-xl border border-lavender-200 bg-paper-50 p-3">
                  <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-lavender-300 bg-lavender-50">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
                      />
                    ) : (
                      <span className="px-1 text-center text-[10px] text-lavender-600">Няма</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <InputField
                      id={`illustration-title-${index}`}
                      label={`Заглавие на илюстрация №${index + 1}`}
                      value={illustrationContent[index].title}
                      onChange={(event) => updateIllustrationContent(index, { title: event.target.value })}
                      required
                    />
                    <InputField
                      id={`illustration-description-${index}`}
                      label="Обяснение под заглавието"
                      value={illustrationContent[index].description}
                      onChange={(event) => updateIllustrationContent(index, { description: event.target.value })}
                      placeholder="остави празно, за да няма обяснение"
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer text-sm font-medium text-burgundy-700 underline underline-offset-4">
                        {uploadingIllustrationIndex === index ? "Качване…" : image ? "Смени снимката" : "Качи снимка"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleIllustrationUpload(index, event)}
                          disabled={uploadingIllustrationIndex === index}
                        />
                      </label>
                      {image ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveIllustrationPositioner(activeIllustrationPositioner === index ? null : index)}
                            className="text-sm font-medium text-burgundy-700 underline underline-offset-4"
                          >
                            {activeIllustrationPositioner === index ? "Скрий позиционирането" : "Позиционирай"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeIllustrationImage(index)}
                            className="text-sm text-ink-700 underline underline-offset-4"
                          >
                            Премахни
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                {image && activeIllustrationPositioner === index ? (
                  <FocalPointPicker image={image} onChange={(focal) => updateIllustrationFocalPoint(index, focal)} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Видео за „Какво има в кутията“</span>
        <p className="text-xs text-ink-700">
          Незадължително — без качено видео секцията показва placeholder кутия на сайта. MP4, WEBM или MOV, макс.
          100MB.
        </p>
        <div className="mt-2 flex items-start gap-4">
          <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-lavender-300 bg-lavender-50">
            {boxContentsVideoUrl ? (
              <video src={boxContentsVideoUrl} controls className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-lavender-600">Няма видео</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer text-sm font-medium text-burgundy-700 underline underline-offset-4">
              {isUploadingBoxVideo ? "Качване…" : boxContentsVideoUrl ? "Смени видеото" : "Качи видео"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleBoxVideoUpload}
                disabled={isUploadingBoxVideo}
              />
            </label>
            {boxContentsVideoUrl ? (
              <button
                type="button"
                onClick={() => setBoxContentsVideoUrl(null)}
                className="text-left text-sm text-ink-700 underline underline-offset-4"
              >
                Премахни видеото
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ink-800">Thumbnail на видеото</span>
        <p className="text-xs text-ink-700">
          Незадължително — показва се преди пускане на видеото. Без него браузърът показва първия кадър на видеото.
        </p>
        <div className="mt-2 flex items-start gap-4">
          <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-lavender-300 bg-lavender-50">
            {boxContentsVideoThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
              <img
                src={boxContentsVideoThumbnail.url}
                alt={boxContentsVideoThumbnail.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-lavender-600">Няма thumbnail</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer text-sm font-medium text-burgundy-700 underline underline-offset-4">
              {isUploadingBoxVideoThumbnail ? "Качване…" : boxContentsVideoThumbnail ? "Смени thumbnail-а" : "Качи thumbnail"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={handleBoxVideoThumbnailUpload}
                disabled={isUploadingBoxVideoThumbnail}
              />
            </label>
            {boxContentsVideoThumbnail ? (
              <button
                type="button"
                onClick={() => setBoxContentsVideoThumbnail(null)}
                className="text-left text-sm text-ink-700 underline underline-offset-4"
              >
                Премахни thumbnail-а
              </button>
            ) : null}
          </div>
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
