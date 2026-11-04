import { z } from "zod";

export const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Моля, въведи име и фамилия.")
      .max(120, "Името е твърде дълго."),
    phone: z
      .string()
      .trim()
      .regex(/^(\+359|0)[0-9]{8,9}$/, "Въведи валиден български телефонен номер, напр. 08XXXXXXXX."),
    email: z
      .string()
      .trim()
      .email("Въведи валиден имейл адрес.")
      .optional()
      .or(z.literal("")),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    deliveryMethod: z.enum(["courier", "box_now"]),
    boxNowLockerId: z.string().trim().optional(),
    boxNowLockerAddressLine1: z.string().trim().optional(),
    boxNowLockerPostalCode: z.string().trim().optional(),
    paymentMethod: z.enum(["card_icard", "cash_on_delivery"]),
    giftMessage: z.string().trim().max(300, "Личното послание е твърде дълго.").optional(),
    quantity: z.number().int().min(1, "Количеството трябва да е поне 1.").max(10, "Максимум 10 броя."),
  })
  .superRefine((values, ctx) => {
    if (values.deliveryMethod === "courier") {
      if (!values.address || values.address.length < 5) {
        ctx.addIssue({ code: "custom", path: ["address"], message: "Въведи адрес за доставка." });
      }
      if (!values.city || values.city.length < 2) {
        ctx.addIssue({ code: "custom", path: ["city"], message: "Въведи населено място." });
      }
      if (!values.postalCode || !/^[0-9]{4}$/.test(values.postalCode)) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Пощенският код трябва да е 4 цифри." });
      }
    }

    if (values.deliveryMethod === "box_now" && !values.boxNowLockerId) {
      ctx.addIssue({
        code: "custom",
        path: ["boxNowLockerId"],
        message: "Избери автомат BOX NOW за доставка.",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
