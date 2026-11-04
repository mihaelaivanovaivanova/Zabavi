export type DeliveryMethodId = "courier" | "box_now";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  /** false renders the option as "coming soon" and disables selection. */
  available: boolean;
}
