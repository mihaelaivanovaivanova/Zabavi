import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";

const validInput = {
  fullName: "Иван Иванов",
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
      address: undefined,
      city: undefined,
      postalCode: undefined,
      boxNowLockerId: "LOCKER-42",
      boxNowLockerAddressLine1: "ул. Тест 5",
      boxNowLockerPostalCode: "1000",
    });
    expect(result.success).toBe(true);
  });
});
