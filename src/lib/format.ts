export function formatBgn(amount: number | null): string {
  if (amount === null) {
    return "предстои да се зададе";
  }
  return `${amount.toFixed(2)} лв.`;
}
