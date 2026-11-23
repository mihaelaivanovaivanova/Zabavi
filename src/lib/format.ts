export function formatEur(amount: number | null): string {
  if (amount === null) {
    return "предстои да се зададе";
  }
  return `${amount.toFixed(2)} €`;
}

/** Returns the rounded discount percentage, or null when no discount is confirmed yet. */
export function discountPercent(priceEur: number | null, compareAtPriceEur: number | null): number | null {
  if (priceEur === null || compareAtPriceEur === null || compareAtPriceEur <= priceEur) {
    return null;
  }
  return Math.round((1 - priceEur / compareAtPriceEur) * 100);
}
