import { z } from "zod";

export const checkoutSchema = z.object({
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
  address: z.string().trim().min(5, "Въведи адрес за доставка."),
  city: z.string().trim().min(2, "Въведи населено място."),
  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Пощенският код трябва да е 4 цифри."),
  deliveryMethod: z.enum(["courier", "box_now"]),
  paymentMethod: z.enum(["card_mypos", "cash_on_delivery"]),
  giftMessage: z.string().trim().max(300, "Личното послание е твърде дълго.").optional(),
  quantity: z.number().int().min(1, "Количеството трябва да е поне 1.").max(10, "Максимум 10 броя."),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
