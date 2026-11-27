import { z } from "zod";
import { product } from "@/config/site";

const variantIds = product.variants.map((variant) => variant.id) as [string, ...string[]];

export const checkoutSchema = z
  .object({
    variantId: z.enum(variantIds),
    firstName: z.string().trim().min(2, "Въведи име.").max(60, "Името е твърде дълго."),
    lastName: z.string().trim().min(2, "Въведи фамилия.").max(60, "Фамилията е твърде дълга."),
    phone: z
      .string()
      .trim()
      .regex(/^(\+359|0)[0-9]{8,9}$/, "Въведи валиден български телефонен номер (08, 09 или 07, последвано от 7 цифри)."),
    email: z
      .string()
      .trim()
      .email("Въведи валиден имейл адрес.")
      .optional()
      .or(z.literal("")),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    deliveryMethod: z.enum(["box_now", "speedy_office", "speedy_locker", "courier"]),
    boxNowLockerId: z.string().trim().optional(),
    boxNowLockerAddressLine1: z.string().trim().optional(),
    boxNowLockerPostalCode: z.string().trim().optional(),
    speedyOfficeId: z.string().trim().optional(),
    speedyOfficeLabel: z.string().trim().optional(),
    speedyOfficeCity: z.string().trim().optional(),
    paymentMethod: z.enum(["card_icard", "cash_on_delivery"]),
    wantsInvoice: z.boolean().optional(),
    invoiceCompany: z.string().trim().optional(),
    invoiceVatNumber: z.string().trim().optional(),
    giftMessage: z.string().trim().max(300, "Личното послание е твърде дълго.").optional(),
    quantity: z.number().int().min(1, "Количеството трябва да е поне 1.").max(10, "Максимум 10 броя."),
  })
  .superRefine((values, ctx) => {
    const hasOwnShippingAddress = values.deliveryMethod === "courier";

    // Shipping address, required whenever delivering straight to a street address.
    if (hasOwnShippingAddress) {
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

    // Billing address, required whenever there's no shipping address to double
    // as one AND either card_icard needs one (iCard's IPGPurchase requires a
    // billing address regardless of delivery method) or an invoice was
    // requested — reuses the same three fields as the block above, since a
    // courier delivery's own shipping address already covers both roles.
    const needsBillingAddress = !hasOwnShippingAddress && (values.paymentMethod === "card_icard" || values.wantsInvoice);
    if (needsBillingAddress) {
      if (!values.address || values.address.length < 5) {
        ctx.addIssue({ code: "custom", path: ["address"], message: "Въведи адрес за фактуриране." });
      }
      if (!values.city || values.city.length < 2) {
        ctx.addIssue({ code: "custom", path: ["city"], message: "Въведи населено място." });
      }
      if (!values.postalCode || !/^[0-9]{4}$/.test(values.postalCode)) {
        ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Пощенският код трябва да е 4 цифри." });
      }
    }

    if (values.wantsInvoice) {
      if (!values.invoiceCompany || values.invoiceCompany.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["invoiceCompany"], message: "Въведи име на фирма." });
      }
      if (!values.invoiceVatNumber || values.invoiceVatNumber.trim().length < 3) {
        ctx.addIssue({ code: "custom", path: ["invoiceVatNumber"], message: "Въведи ДДС номер." });
      }
    }

    if (values.deliveryMethod === "box_now" && !values.boxNowLockerId) {
      ctx.addIssue({ code: "custom", path: ["boxNowLockerId"], message: "Избери автомат BOX NOW за доставка." });
    }

    if ((values.deliveryMethod === "speedy_office" || values.deliveryMethod === "speedy_locker") && !values.speedyOfficeId) {
      ctx.addIssue({
        code: "custom",
        path: ["speedyOfficeId"],
        message:
          values.deliveryMethod === "speedy_office" ? "Избери офис на Speedy за доставка." : "Избери автомат на Speedy за доставка.",
      });
    }

    // Cash on delivery is only offerable through Speedy (which meets the
    // customer in person to collect) — BOX NOW's locker network has no
    // courier at the door, same gating as smisul.bg's PaymentService.
    if (values.paymentMethod === "cash_on_delivery" && values.deliveryMethod === "box_now") {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Наложен платеж не е наличен за доставка с BOX NOW." });
    }

    // iCard's IPGPurchase requires the cardholder's email.
    if (values.paymentMethod === "card_icard" && !values.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Имейл е задължителен за плащане с карта." });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
