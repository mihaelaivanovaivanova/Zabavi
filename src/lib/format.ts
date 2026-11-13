export function formatBgn(amount: number | null): string {
  if (amount === null) {
    return "предстои да се зададе";
  }
  return `${amount.toFixed(2)} лв.`;
}

/** Returns the rounded discount percentage, or null when no discount is confirmed yet. */
export function discountPercent(priceBgn: number | null, compareAtPriceBgn: number | null): number | null {
  if (priceBgn === null || compareAtPriceBgn === null || compareAtPriceBgn <= priceBgn) {
    return null;
  }
  return Math.round((1 - priceBgn / compareAtPriceBgn) * 100);
}
