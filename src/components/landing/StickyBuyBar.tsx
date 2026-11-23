import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { StarRating } from "@/components/ui/StarRating";
import { formatEur } from "@/lib/format";

export function StickyBuyBar({
  visible,
  imageUrl,
  imageAlt,
  imageFocalX,
  imageFocalY,
  name,
  priceEur,
  rating,
  reviewCount,
  justAdded,
  onAddToCart,
}: {
  visible: boolean;
  imageUrl: string | undefined;
  imageAlt: string;
  imageFocalX?: number;
  imageFocalY?: number;
  name: string;
  priceEur: number | null;
  rating: number;
  reviewCount: number;
  justAdded: boolean;
  onAddToCart: () => void;
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-lavender-200 bg-paper-50/95 px-4 py-3 backdrop-blur transition-transform duration-300 sm:px-8 ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ boxShadow: "0 -4px 16px rgba(0,0,0,0.08)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded asset, not an optimized remote image
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
              style={{ objectPosition: `${imageFocalX ?? 50}% ${imageFocalY ?? 50}%` }}
            />
          ) : (
            <PlaceholderImage label="" alt={imageAlt} aspect="square" className="h-full w-full rounded-lg" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-sm font-semibold text-ink-900">{name}</span>
            <span className="text-sm font-semibold text-burgundy-700">{formatEur(priceEur)}</span>
          </div>
          <StarRating value={rating} count={reviewCount} starClassName="h-3.5 w-3.5" />
        </div>
        <Button
          type="button"
          variant="primary"
          className="shrink-0 px-5 py-2 text-sm"
          tabIndex={visible ? 0 : -1}
          onClick={onAddToCart}
        >
          {justAdded ? "Добавено ✓" : "Добави"}
        </Button>
      </div>
    </div>
  );
}
