import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";

const validInput = {
  variantId: "christmas-magic",
  firstName: "Иван",
  lastName: "Иванов",
  phone: "0888123456",
  email: "",
  address: "ул. Примерна 1",
  city: "София",
  postalCode: "1000",
  deliveryMethod: "courier" as const,
  paymentMethod: "cash_on_delivery" as const,
  giftMessage: "",
  quantity: 1,
};

describe("checkoutSchema", () => {
  it("accepts a valid Bulgarian checkout payload", () => {
    const result = checkoutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phone number", () => {
    const result = checkoutSchema.safeParse({ ...validInput, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects a postal code that is not 4 digits", () => {
    const result = checkoutSchema.safeParse({ ...validInput, postalCode: "AB12" });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity of 0", () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown delivery method", () => {
    const result = checkoutSchema.safeParse({ ...validInput, deliveryMethod: "drone" });
    expect(result.success).toBe(false);
  });

  it("rejects box_now delivery without a selected locker", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      deliveryMethod: "box_now",
      address: undefined,
      city: undefined,
      postalCode: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("accepts box_now delivery with a selected locker and no street address", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      deliveryMethod: "box_now",
      // box_now has no courier to meet in person, so it can't pair with
      // cash_on_delivery (see the "rejects cash on delivery combined with
      // BOX NOW" test below) — card_icard is the only valid payment method,
      // which in turn requires an email and a billing address.
      paymentMethod: "card_icard",
      email: "ivan@example.com",
      boxNowLockerId: "LOCKER-42",
      boxNowLockerAddressLine1: "ул. Тест 5",
      boxNowLockerPostalCode: "1000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects speedy_office/speedy_locker delivery without a selected office", () => {
    for (const deliveryMethod of ["speedy_office", "speedy_locker"] as const) {
      const result = checkoutSchema.safeParse({ ...validInput, deliveryMethod });
      expect(result.success).toBe(false);
    }
  });

  it("accepts speedy_office/speedy_locker delivery with a selected office", () => {
    for (const deliveryMethod of ["speedy_office", "speedy_locker"] as const) {
      const result = checkoutSchema.safeParse({
        ...validInput,
        deliveryMethod,
        speedyOfficeId: "4567",
        speedyOfficeLabel: "СОФИЯ ЦЕНТЪР",
        speedyOfficeCity: "София",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects cash on delivery combined with BOX NOW (no courier meets the customer in person)", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      deliveryMethod: "box_now",
      boxNowLockerId: "LOCKER-42",
      boxNowLockerAddressLine1: "ул. Тест 5",
      boxNowLockerPostalCode: "1000",
      paymentMethod: "cash_on_delivery",
    });
    expect(result.success).toBe(false);
  });
});
