# ЗАБАВЍ (ZABAVI)

Мобилно-ориентиран landing/sales funnel и checkout демо за премиум творческия подарък на ЗАБАВЍ — акварелен creative kit.

## Стартиране

```bash
npm install
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000).

## Налични команди

| Команда | Описание |
| --- | --- |
| `npm run dev` | Development сървър (Next.js, Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Стартира production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit тестове (Vitest) |

## Структура

- `src/app` — страници и route handlers (App Router)
- `src/domain` — framework-agnostic бизнес логика (продукт, количка, поръчка, доставка, плащане)
- `src/infrastructure` — заменими имплементации (mock платежни провайдъри, in-memory repository)
- `src/components` — UI компоненти (`landing`, `checkout`, `brand`, `ui`, `legal`)
- `src/config/site.ts` — единен конфигурационен обект за продукт, цена, доставка, FAQ, trust-съдържание
- `src/lib` — валидация (Zod) и помощни функции

## Брандинг

Официалните SVG лога са в `public/brand/` и се зареждат през `src/components/brand/Logo.tsx` (проп `variant`):

| Вариант | Файл | Употреба |
| --- | --- | --- |
| `wordmark` (по подразбиране) | `zabavi-wordmark.svg` | Хедър/футър, светъл фон |
| `stacked` | `zabavi-wordmark-stacked.svg` | Квадратен формат, светъл фон |
| `stacked-light` | `zabavi-wordmark-stacked-light.svg` | Квадратен формат, тъмен/бордо фон |
| `lockup` | `zabavi-lockup.svg` | Wordmark + символа "II" |
| `mark` | `zabavi-mark.svg` | Самостоятелен символ "II" — използва се и като favicon (`src/app/icon.svg`) |
| `badge` | `zabavi-badge.svg` | Кръгъл печат/badge с пълния wordmark |

Цветовата палитра (`src/app/globals.css`, `--color-burgundy-*` / `--color-accent-*`) е подравнена с точните цветове от логото.

## Какво работи

- Пълен responsive landing funnel (13 секции) с конфигурируемо съдържание.
- Checkout демо: guest-only форма с валидация (React Hook Form + Zod), избор на количество, доставка, плащане и лично послание.
- Сървърен `/api/checkout` endpoint: валидира отново на сървъра, прекалкулира totals само от `src/config/site.ts` (никога не вярва на цена от клиента) и връща ясно обозначен демо резултат.
- Payment provider абстракция (`PaymentProvider`) с два mock провайдъра — `MyPosStubProvider` и `CashOnDeliveryProvider` — готова да се замени с реална myPOS интеграция без промяна на останалия код.
- Unit тестове за ценообразуване, валидация и избор на payment provider.

## Какво е мокнато / демонстрационно

- **Продуктовите снимки и 4 илюстрации** са placeholder блокове (`PlaceholderImage`), не реални изображения.
- **Цената** е `null` (TBD) в `src/config/site.ts` — никъде не се показва или изчислява измислена сума.
- **Плащанията** (карта през myPOS и наложен платеж) са изцяло симулирани — няма реален network call, няма истински credentials, никаква поръчка не се запазва извън in-memory demo repository (нулира се при рестарт).
- **Доставка, връщане, FAQ детайли** съдържат placeholder текст, маркиран ясно като "предстои да се зададе" — без измислени факти, гаранции или stock urgency.

## Предстои (извън обхвата на тази фаза)

- Реална myPOS интеграция (Фаза 2): hosted payment page, верификация на нотификации по подпис съгласно официалната myPOS документация, идемпотентна обработка на webhook-и. Ще изисква sandbox/production credentials през environment variables (напр. `MYPOS_SID`, `MYPOS_WALLET_NUMBER`, `MYPOS_PRIVATE_KEY`) — никога hardcoded.
- Истинска PostgreSQL база (Railway) зад съществуващите repository интерфейси.
- BOX NOW интеграция зад `DeliveryMethod` абстракцията.
- Реални продуктови снимки и илюстрации (логото вече е реалното от `public/brand/`).
- Реална цена и условия за доставка/връщане.
