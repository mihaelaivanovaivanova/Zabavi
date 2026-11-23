const badges = [
  { src: "/icons/trust/delivery.svg", label: "Доставка 1-2 работни дни" },
  { src: "/icons/trust/secure-payment.svg", label: "Сигурно плащане с карта" },
  { src: "/icons/trust/cash-payment.svg", label: "Наложен платеж" },
  { src: "/icons/trust/quality.svg", label: "100% гаранция за качество" },
  { src: "/icons/trust/returns.svg", label: "30 дни право на връщане" },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-5 text-center sm:grid-cols-5">
      {badges.map((badge) => (
        <div key={badge.label} className="flex flex-col items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, rendered as a crisp vector, not an optimized raster */}
          <img src={badge.src} alt="" aria-hidden="true" className="h-8 w-8" />
          <span className="text-[11px] font-semibold leading-tight text-ink-800">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
