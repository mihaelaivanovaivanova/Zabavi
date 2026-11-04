import type { DeliveryMethod } from "@/domain/shipping/types";
import type { PaymentMethodOption } from "@/domain/payment/types";
import type { Product } from "@/domain/product/types";

/**
 * Single source of truth for all public-facing content. Nothing here is
 * invented: prices, delivery times and return terms stay as explicit TBD
 * placeholders until the business confirms real figures.
 */
export const siteConfig = {
  brand: {
    name: "ЗАБАВЍ",
    wordmark: "ЗАБАВЍ",
    tagline: "Забавѝ. Поеми си дъх. Направи място за себе си.",
    description:
      "ЗАБАВЍ създава премиум творчески подаръци, които канят към пауза, спокойствие и истински момент с четка в ръка.",
    url: "https://zabavi.example",
  },
  contact: {
    email: "hello@zabavi.example",
  },
  integrations: {
    boxNow: {
      /** Set once BOX NOW issues a partner ID after merchant registration (integrationsupport@boxnow.bg). */
      partnerId: undefined as number | undefined,
    },
  },
} as const;

export const product: Product = {
  slug: "akvarelen-nabor",
  name: "Премиум акварелен creative kit",
  tagline: "Кутия с четири платна, шест цвета и една покана да забавиш темпото",
  description:
    "Цялостен комплект за рисуване с акварел, създаден за начинаещи и за всеки, който иска спокоен творчески момент — със всичко необходимо вътре, елегантно опаковано като подарък.",
  heroImage: {
    label: "Снимка на опакования комплект",
    alt: "Опакован акварелен creative kit ЗАБАВЍ с панделка",
  },
  boxContents: [
    "4 оригинални илюстрации с контури, подходящи за начинаещи",
    "6 координирани акварелни цвета, поднесени като цветни капки",
    "Четка за рисуване",
    "Художническа палитра за смесване",
    "Малък съд за вода",
    "Елегантна подаръчна опаковка с панделка и място за лично послание",
  ],
  illustrations: [
    {
      title: "Илюстрация №1",
      description: "Контурна композиция, подходяща за първи стъпки с акварел.",
      image: { label: "Илюстрация №1", alt: "Контурна скица №1 от комплекта" },
    },
    {
      title: "Илюстрация №2",
      description: "Контурна композиция, подходяща за първи стъпки с акварел.",
      image: { label: "Илюстрация №2", alt: "Контурна скица №2 от комплекта" },
    },
    {
      title: "Илюстрация №3",
      description: "Контурна композиция, подходяща за първи стъпки с акварел.",
      image: { label: "Илюстрация №3", alt: "Контурна скица №3 от комплекта" },
    },
    {
      title: "Илюстрация №4",
      description: "Контурна композиция, подходяща за първи стъпки с акварел.",
      image: { label: "Илюстрация №4", alt: "Контурна скица №4 от комплекта" },
    },
  ],
  variants: [{ id: "standard", label: "Стандартен комплект" }],
  priceBgn: null,
  currency: "BGN",
};

export function getProductBySlug(slug: string): Product | undefined {
  return slug === product.slug ? product : undefined;
}

export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "courier",
    label: "Доставка с куриер до адрес",
    description: "Срокове и цена на доставка: предстои да бъдат зададени.",
    available: true,
  },
  {
    id: "box_now",
    label: "BOX NOW — автомат за пратки",
    description: "Избери автомат за доставка чрез официалната карта на BOX NOW.",
    available: true,
  },
];

export const paymentMethods: PaymentMethodOption[] = [
  {
    id: "card_mypos",
    label: "Карта (myPOS)",
    description: "Сигурно онлайн разплащане с карта. В тази демонстрация плащането не се обработва реално.",
    isDemo: true,
  },
  {
    id: "cash_on_delivery",
    label: "Наложен платеж",
    description: "Плащане в брой при получаване на пратката.",
    isDemo: true,
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "За кого е подходящ комплектът?",
    answer:
      "Илюстрациите имат готови контури, така че наборът е подходящ за начинаещи и за хора без предишен опит с акварел.",
  },
  {
    question: "Какво точно получавам в кутията?",
    answer:
      "Четири оригинални илюстрации с контури, шест координирани акварелни цвета, четка, палитра за смесване, малък съд за вода и елегантна опаковка с панделка и място за лично послание.",
  },
  {
    question: "Мога ли да добавя лично послание към подаръка?",
    answer: "Да — при поръчката има поле за незадължително лично послание, което се предава заедно с подаръка.",
  },
  {
    question: "Какви са цената и начините на доставка?",
    answer: "Цената и условията за доставка предстои да бъдат публикувани тук.",
  },
];

export const trustContent = {
  shipping: "Информация за срокове и цени на доставка: предстои да се добави.",
  returns: "Условия за връщане и рекламации: предстои да се добави.",
  payment: "Приемаме плащане с карта (чрез myPOS) и наложен платеж. Подробности предстои да се добавят.",
};
