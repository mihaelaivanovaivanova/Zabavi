import { siteConfig, product } from "@/config/site";
import type { OrderDraft } from "@/domain/order/types";
import { formatEur } from "@/lib/format";
import { getEmailProvider } from "@/infrastructure/email/emailProvider";
import { kitRepository } from "@/infrastructure/repositories/kitRepository";

/**
 * Order-lifecycle emails, triggered only from `orderStatusService.ts`'s
 * `transitionOrderStatus()` — never directly from checkout/webhooks — same
 * plain-HTML convention as `reviewService.ts` (no templating engine).
 */

function escapeHtml(value: string): string {
  const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => escapes[char]);
}

function itemLabel(variantId: string): string {
  return product.variants.find((variant) => variant.id === variantId)?.label ?? variantId;
}

export function shippingAddressLine(order: OrderDraft): string {
  const details = order.shippingDetails;
  switch (details.method) {
    case "courier":
      return `${details.address}, ${details.city} ${details.postalCode}`;
    case "box_now":
      return `BOX NOW автомат ${details.lockerId} — ${details.addressLine1} ${details.postalCode}`;
    case "speedy_office":
      return `Speedy офис — ${details.officeLabel}`;
    case "speedy_locker":
      return `Speedy автомат — ${details.officeLabel}`;
  }
}

function itemsListHtml(order: OrderDraft): string {
  return order.items
    .map((item) => `<li>${escapeHtml(itemLabel(item.variantId))} × ${item.quantity}</li>`)
    .join("");
}

function totalsHtml(order: OrderDraft): string {
  const snapshot = order.totalsSnapshot;
  const rows: string[] = [];
  if (snapshot) {
    rows.push(`<tr><td>Междинна сума</td><td align="right">${formatEur(snapshot.subtotalEur)}</td></tr>`);
    rows.push(`<tr><td>Доставка</td><td align="right">${formatEur(snapshot.shippingEur)}</td></tr>`);
    if (snapshot.codFeeEur) {
      rows.push(`<tr><td>Такса наложен платеж</td><td align="right">${formatEur(snapshot.codFeeEur)}</td></tr>`);
    }
  }
  rows.push(
    `<tr><td><strong>Обща сума</strong></td><td align="right"><strong>${formatEur(order.totalEur)}</strong></td></tr>`,
  );
  return `<table cellpadding="4">${rows.join("")}</table>`;
}

function orderDisplayNumber(order: OrderDraft): string {
  return order.orderNumber ?? order.id.slice(0, 8).toUpperCase();
}

export async function sendOrderConfirmationEmail(order: OrderDraft): Promise<void> {
  if (!order.customer.email) return;

  await getEmailProvider().send({
    to: order.customer.email,
    subject: `Поръчка ${orderDisplayNumber(order)} е потвърдена`,
    html: `
      <p>Здравей, ${escapeHtml(order.customer.fullName)},</p>
      <p>Поръчка <strong>${orderDisplayNumber(order)}</strong> към ${escapeHtml(siteConfig.brand.name)} е потвърдена.</p>
      <ul>${itemsListHtml(order)}</ul>
      ${totalsHtml(order)}
      <p>Адрес за доставка: ${escapeHtml(shippingAddressLine(order))}</p>
      <p>Начин на плащане: ${order.paymentMethod === "card_icard" ? "Карта" : "Наложен платеж"}</p>
    `,
  });
}

export async function sendAdminOrderNotificationEmail(order: OrderDraft): Promise<void> {
  const addresses = (process.env.ORDER_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.length > 0);

  for (const to of addresses) {
    await getEmailProvider().send({
      to,
      subject: `Нова поръчка ${orderDisplayNumber(order)}`,
      html: `
        <p>Нова поръчка <strong>${orderDisplayNumber(order)}</strong>.</p>
        <p>Клиент: ${escapeHtml(order.customer.fullName)}, ${escapeHtml(order.customer.phone)}${
          order.customer.email ? `, ${escapeHtml(order.customer.email)}` : ""
        }</p>
        <ul>${itemsListHtml(order)}</ul>
        ${totalsHtml(order)}
        <p>Доставка: ${escapeHtml(shippingAddressLine(order))}</p>
      `,
    });
  }
}

export async function sendOrderCancelledEmail(order: OrderDraft): Promise<void> {
  if (!order.customer.email) return;

  await getEmailProvider().send({
    to: order.customer.email,
    subject: `Поръчка ${orderDisplayNumber(order)} е отказана`,
    html: `
      <p>Здравей, ${escapeHtml(order.customer.fullName)},</p>
      <p>Поръчка <strong>${orderDisplayNumber(order)}</strong> към ${escapeHtml(siteConfig.brand.name)} беше отказана.</p>
      <p>Ако това е станало по грешка, свържи се с нас на ${escapeHtml(siteConfig.contact.email)}.</p>
    `,
  });
}

export async function sendOrderDeliveredEmail(order: OrderDraft): Promise<void> {
  if (!order.customer.email) return;

  await getEmailProvider().send({
    to: order.customer.email,
    subject: `Поръчка ${orderDisplayNumber(order)} е доставена`,
    html: `
      <p>Здравей, ${escapeHtml(order.customer.fullName)},</p>
      <p>Поръчка <strong>${orderDisplayNumber(order)}</strong> беше доставена. Благодарим ти, че избра ${escapeHtml(siteConfig.brand.name)}!</p>
    `,
  });
}

/**
 * The order's legally required sales document (чл. 6, ал. 1 ЗСч), titled
 * "Фактура" by Bulgarian convention even though the company behind
 * ${siteConfig.brand.name} isn't ДДС-registered — same seller identity as
 * smisul.bg (see `siteConfig.company`'s own doc comment). Sent at delivery,
 * when the sale is actually realized, not at placement/payment — mirrors
 * smisul.bg's `SendOrderStatusEmails` reasoning exactly.
 */
export async function sendOrderInvoiceEmail(order: OrderDraft): Promise<void> {
  if (!order.customer.email) return;

  const rows = await Promise.all(
    order.items.map(async (item) => {
      const kit = await kitRepository.get(item.variantId);
      const unitPrice = kit.priceEur ?? 0;
      return `<tr><td>${escapeHtml(itemLabel(item.variantId))}</td><td align="right">${item.quantity}</td><td align="right">${formatEur(unitPrice)}</td><td align="right">${formatEur(unitPrice * item.quantity)}</td></tr>`;
    }),
  );

  const vatLine = siteConfig.company.vatRegistered
    ? ""
    : "<p>Дружеството не е регистрирано по ЗДДС — цените не включват ДДС.</p>";

  await getEmailProvider().send({
    to: order.customer.email,
    subject: `Фактура за поръчка ${orderDisplayNumber(order)}`,
    html: `
      <p>Продавач: ${escapeHtml(siteConfig.company.legalName)}, ЕИК ${escapeHtml(siteConfig.company.eik)}, ${escapeHtml(siteConfig.company.address)}, управител ${escapeHtml(siteConfig.company.manager)}.</p>
      <p>Купувач: ${escapeHtml(order.customer.fullName)}</p>
      <table cellpadding="4">
        <thead><tr><th align="left">Артикул</th><th align="right">Бр.</th><th align="right">Ед. цена</th><th align="right">Сума</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>
      ${totalsHtml(order)}
      ${vatLine}
    `,
  });
}
