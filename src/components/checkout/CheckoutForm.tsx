"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/checkout/StepIndicator";
import { CustomerInfoStep } from "@/components/checkout/CustomerInfoStep";
import { DeliveryAndPaymentStep } from "@/components/checkout/DeliveryAndPaymentStep";
import { OrderReviewStep } from "@/components/checkout/OrderReviewStep";
import { ICardPaymentWidget } from "@/components/checkout/ICardPaymentWidget";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validation";
import { product } from "@/config/site";
import { resolveVariant } from "@/domain/kit/types";
import { useCart } from "@/lib/CartContext";
import { useKits } from "@/lib/useKits";
import { usePricing } from "@/lib/usePricing";
import { useSettlements } from "@/lib/useSettlements";
import { useBoxNowLockers } from "@/lib/useBoxNowLockers";

type WizardStep = 1 | 2 | 3 | 4;

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

const STEP_1_FIELDS = ["variantId", "firstName", "lastName", "phone", "email", "quantity", "giftMessage"] as const;
const STEP_2_FIELDS = [
  "deliveryMethod",
  "address",
  "city",
  "postalCode",
  "boxNowLockerId",
  "speedyOfficeId",
  "paymentMethod",
] as const;

export function CheckoutForm() {
  const [step, setStep] = useState<WizardStep>(1);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const { item: cartItem, clearCart } = useCart();
  const searchParams = useSearchParams();
  const requestedVariant = cartItem?.variantId ?? searchParams.get("variant");
  const defaultVariantId =
    product.variants.find((variant) => variant.id === requestedVariant)?.id ?? product.variants[0].id;
  const requestedQuantity = cartItem?.quantity ?? Number(searchParams.get("quantity"));
  const defaultQuantity =
    Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= 10 ? requestedQuantity : 1;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      variantId: defaultVariantId,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      deliveryMethod: "box_now",
      boxNowLockerId: "",
      boxNowLockerAddressLine1: "",
      boxNowLockerPostalCode: "",
      speedyOfficeId: "",
      speedyOfficeLabel: "",
      speedyOfficeCity: "",
      paymentMethod: "card_icard",
      wantsInvoice: false,
      giftMessage: "",
      quantity: defaultQuantity,
    },
  });

  const variantId = watch("variantId");
  const quantity = watch("quantity");
  const deliveryMethod = watch("deliveryMethod");
  const paymentMethod = watch("paymentMethod");
  const { kits } = useKits();
  const pricing = usePricing();
  // Fired here, on mount of the whole wizard (step 1), rather than lazily
  // inside SpeedyOfficePicker/AddressFields/BoxNowLockerPicker (step 2) —
  // smisul.bg's own checkout starts these fetches the moment the checkout
  // page loads for the same reason: by the time someone has filled in their
  // name/phone/email and reached the delivery step, the ~5,300-row
  // settlement list (and BOX NOW's own locations feed) has had that whole
  // stretch of time to arrive, instead of only starting once the picker
  // that needs it happens to mount. Both hooks share a page-lifetime cache
  // (see useSettlements.ts/useBoxNowLockers.ts), so this is the only fetch.
  useSettlements();
  useBoxNowLockers();
  const activeKitPriceEur = kits.find((kit) => kit.variantId === variantId)?.priceEur ?? null;
  const resolvedVariants = product.variants.map((variant) =>
    resolveVariant(
      variant,
      kits.find((kit) => kit.variantId === variant.id),
    ),
  );

  // The cart hydrates from localStorage a tick after first render, so apply
  // its values once available in case they arrived too late for the form's
  // initial defaultValues above.
  useEffect(() => {
    if (!cartItem) return;
    const variant = product.variants.find((v) => v.id === cartItem.variantId)?.id ?? product.variants[0].id;
    setValue("variantId", variant);
    setValue("quantity", cartItem.quantity);
  }, [cartItem, setValue]);

  async function goToNextStep() {
    const fieldsToValidate = step === 1 ? STEP_1_FIELDS : STEP_2_FIELDS;
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setStep((current) => (Math.min(current + 1, 3) as WizardStep));
  }

  function goToPreviousStep() {
    setStep((current) => (Math.max(current - 1, 1) as WizardStep));
  }

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
        clearCart();
        setStep(4);
        setSubmitState({
          status: "awaiting_card_payment",
          orderId: data.orderId,
          widgetToken: data.paymentWidgetToken,
          shippingNotice: data.shippingNotice,
        });
        return;
      }

      clearCart();
      setStep(4);
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
        <Badge tone="neutral">Поръчка</Badge>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          {isAnyPartLive ? "Поръчката е приета" : "Поръчката е получена"}
        </h2>
        <p className="mt-2 text-sm text-ink-700">{submitState.shippingNotice}</p>
        <p className="mt-2 text-sm text-ink-700">{submitState.paymentNotice}</p>
        <p className="mt-4 text-xs text-ink-700">ID: {submitState.orderId}</p>
      </div>
    );
  }

  const variantLabel = resolvedVariants.find((variant) => variant.id === variantId)?.label;

  return (
    <form onSubmit={(event) => event.preventDefault()} className="grid gap-10 sm:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <StepIndicator currentStep={step} />

        {step === 1 ? (
          <CustomerInfoStep register={register} errors={errors} emailRequired={paymentMethod === "card_icard"} />
        ) : null}

        {step === 2 ? (
          <DeliveryAndPaymentStep
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            codFeeEur={pricing.codFeeEur}
            shippingPrices={pricing.shippingPrices}
          />
        ) : null}

        {step === 3 ? <OrderReviewStep values={watch()} variantLabel={variantLabel} /> : null}

        {submitState.status === "error" ? (
          <p role="alert" className="text-sm text-burgundy-600">
            {submitState.message}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={goToPreviousStep}>
              Назад
            </Button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <Button type="button" onClick={goToNextStep}>
              Напред
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit(onSubmit)} disabled={submitState.status === "submitting"}>
              {submitState.status === "submitting" ? "Изпращане…" : "Завърши поръчката"}
            </Button>
          )}
        </div>
      </div>

      <div>
        <CheckoutSummary
          quantity={Number(quantity) || 1}
          variantLabel={variantLabel}
          priceEur={activeKitPriceEur}
          deliveryMethod={deliveryMethod}
          isCashOnDelivery={paymentMethod === "cash_on_delivery"}
          shippingPrices={pricing.shippingPrices}
          codFeeEur={pricing.codFeeEur}
          isShippingKnown={step >= 2}
        />
      </div>
    </form>
  );
}
