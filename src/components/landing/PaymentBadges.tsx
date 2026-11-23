export function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
      <img src="/icons/payments/apple-pay.svg" alt="Apple Pay" className="h-10 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
      <img src="/icons/payments/google-pay.svg" alt="Google Pay" className="h-10 w-auto" />
      <div className="flex h-10 items-center justify-center rounded-lg border border-lavender-200 bg-paper-50 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
        <img src="/icons/payments/visa.svg" alt="Visa" className="h-4 w-auto" />
      </div>
      <div className="flex h-10 items-center justify-center rounded-lg border border-lavender-200 bg-paper-50 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
        <img src="/icons/payments/mastercard.svg" alt="Mastercard" className="h-6 w-auto" />
      </div>
    </div>
  );
}
