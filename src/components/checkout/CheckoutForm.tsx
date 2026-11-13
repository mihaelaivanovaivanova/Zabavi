"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InputField, TextareaField } from "@/components/ui/Field";
import { AddressFields } from "@/components/checkout/AddressFields";
import { BoxNowLockerPicker, type BoxNowSelection } from "@/components/checkout/BoxNowLockerPicker";
import { DeliveryMethodSelector } from "@/components/checkout/DeliveryMethodSelector";
import { ICardPaymentWidget } from "@/components/checkout/ICardPaymentWidget";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { VariantSelector } from "@/components/checkout/VariantSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validation";
import { product } from "@/config/site";
import { useKits } from "@/lib/useKits";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "awaiting_card_payment"; orderId: string; widgetToken: string; shippingNotice: string }
  | {
      status: "success";
      orderId: string;
      paymentNotice: string;
      shippingNotice: string;
      paymentIsLive: boolean;
      shippingIsLive: boolean;
    }
  | { status: "error"; message: string };

export function CheckoutForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const searchParams = useSearchParams();
  const requestedVariant = searchParams.get("variant");
  const defaultVariantId =
    product.variants.find((variant) => variant.id === requestedVariant)?.id ?? product.variants[0].id;
  const requestedQuantity = Number(searchParams.get("quantity"));
  const defaultQuantity =
    Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= 10 ? requestedQuantity : 1;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      variantId: defaultVariantId,
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      deliveryMethod: "courier",
      boxNowLockerId: "",
      boxNowLockerAddressLine1: "",
      boxNowLockerPostalCode: "",
      paymentMethod: "cash_on_delivery",
      giftMessage: "",
      quantity: defaultQuantity,
    },
  });

  const variantId = watch("variantId");
  const quantity = watch("quantity");
  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const boxNowLockerId = watch("boxNowLockerId");
  const boxNowLockerAddressLine1 = watch("boxNowLockerAddressLine1");
  const boxNowLockerPostalCode = watch("boxNowLockerPostalCode");
  const { kits } = useKits();
  const activeKitPriceBgn = kits.find((kit) => kit.variantId === variantId)?.priceBgn ?? null;

  const handleLockerSelect = useCallback(
    (selection: BoxNowSelection) => {
      setValue("boxNowLockerId", selection.lockerId, { shouldValidate: true });
      setValue("boxNowLockerAddressLine1", selection.addressLine1);
      setValue("boxNowLockerPostalCode", selection.postalCode);
    },
    [setValue],
  );

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitState({ status: "submitting" });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitState({
          status: "error",
          message: "Моля, провери въведените данни и опитай отново.",
        });
        return;
      }

      if (data.paymentWidgetToken) {
        setSubmitState({
          status: "awaiting_card_payment",
          orderId: data.orderId,
          widgetToken: data.paymentWidgetToken,
          shippingNotice: data.shippingNotice,
        });
        return;
      }

      setSubmitState({
        status: "success",
        orderId: data.orderId,
        paymentNotice: data.paymentNotice,
        shippingNotice: data.shippingNotice,
        paymentIsLive: Boolean(data.paymentIsLive),
        shippingIsLive: Boolean(data.shippingIsLive),
      });
    } catch {
      setSubmitState({ status: "error", message: "Нещо се обърка. Опитай отново." });
    }
  }

  if (submitState.status === "awaiting_card_payment") {
    return (
      <div className="rounded-2xl border border-lavender-300 bg-paper-50 p-8">
        <Badge tone="neutral">Плащане</Badge>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">Завърши плащането</h2>
        <p className="mt-3 text-ink-800">{submitState.shippingNotice}</p>
        <div className="mt-6">
          <ICardPaymentWidget token={submitState.widgetToken} />
        </div>
        <p className="mt-4 text-xs text-ink-700">ID на поръчката: {submitState.orderId}</p>
      </div>
    );
  }

  if (submitState.status === "success") {
    const isAnyPartLive = submitState.paymentIsLive || submitState.shippingIsLive;
    return (
      <div className="rounded-2xl border border-sage-300 bg-sage-50 p-8 text-center">
        <Badge tone="neutral">{isAnyPartLive ? "Поръчка" : "Демо"}</Badge>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          {isAnyPartLive ? "Поръчката е приета" : "Демонстрацията е завършена"}
        </h2>
        <p className="mt-3 text-ink-800">
          {isAnyPartLive
            ? "Част от обработката по-долу е реална; останалата остава демонстрационна, докато не бъдат зададени липсващите данни/credentials."
            : "Това е прототип на checkout. Няма подадена реална поръчка и не е извършено реално плащане."}
        </p>
        <p className="mt-2 text-sm text-ink-700">{submitState.shippingNotice}</p>
        <p className="mt-2 text-sm text-ink-700">{submitState.paymentNotice}</p>
        <p className="mt-4 text-xs text-ink-700">{isAnyPartLive ? "ID" : "Демо ID"}: {submitState.orderId}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 sm:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <div className="rounded-2xl bg-accent-400/10 px-4 py-3 text-sm text-accent-600">
          Това е демонстрационен checkout. Не се подава реална поръчка и не се обработва реално плащане.
        </div>

        <VariantSelector register={() => register("variantId")} />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-900">Данни за контакт</h2>
          <InputField label="Име и фамилия" {...register("fullName")} error={errors.fullName?.message} />
          <InputField label="Телефон" type="tel" {...register("phone")} error={errors.phone?.message} />
          <InputField
            label={paymentMethod === "card_icard" ? "Имейл" : "Имейл (незадължително)"}
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>

        <DeliveryMethodSelector register={() => register("deliveryMethod")} />

        {deliveryMethod === "box_now" ? (
          <BoxNowLockerPicker
            selected={
              boxNowLockerId
                ? {
                    lockerId: boxNowLockerId,
                    addressLine1: boxNowLockerAddressLine1 ?? "",
                    postalCode: boxNowLockerPostalCode ?? "",
                  }
                : null
            }
            onSelect={handleLockerSelect}
            error={errors.boxNowLockerId?.message}
          />
        ) : (
          <AddressFields register={register} errors={errors} />
        )}

        <PaymentMethodSelector register={() => register("paymentMethod")} />

        {deliveryMethod === "box_now" && paymentMethod === "card_icard" ? (
          <AddressFields register={register} errors={errors} title="Адрес за фактуриране" />
        ) : null}

        <div className="space-y-4">
          <InputField
            label="Брой кутии"
            type="number"
            min={1}
            max={10}
            {...register("quantity", { valueAsNumber: true })}
            error={errors.quantity?.message}
          />
          <TextareaField
            label="Лично послание (незадължително)"
            {...register("giftMessage")}
            error={errors.giftMessage?.message}
          />
        </div>

        {submitState.status === "error" ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {submitState.message}
          </p>
        ) : null}

        <Button type="submit" disabled={submitState.status === "submitting"}>
          {submitState.status === "submitting" ? "Изпращане…" : "Завърши поръчката (демо)"}
        </Button>
      </div>

      <div>
        <OrderSummary
          quantity={Number(quantity) || 1}
          variantLabel={product.variants.find((variant) => variant.id === variantId)?.label}
          priceBgn={activeKitPriceBgn}
        />
      </div>
    </form>
  );
}
