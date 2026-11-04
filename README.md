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

## BOX NOW интеграция

Базирано на официалния "BOX NOW API Integration — Partner API" наръчник (www.boxnow.bg/en/partner-api):

- **Widget за избор на автомат** (`https://widget-cdn.boxnow.bg/map-widget/client/v5.js`, конфигурация `window._bn_map_widget_config`) — публичен, не изисква OAuth. Връща реален `boxnowLockerId` / `boxnowLockerAddressLine1` / `boxnowLockerPostalCode` от продукционните данни на BOX NOW. Използва се в checkout-а.
- **Забележка**: PDF наръчникът (v1.69) съдържа печатна грешка в hostname-а на widget script-а (`widgetcdn.boxnow.bg` без тире) — потвърдено е, че реалният, работещ хост е `widget-cdn.boxnow.bg` (с тире).
- **Реалното REST API за създаване на пратка** вече е имплементирано (`src/infrastructure/shipping/boxNowApiClient.ts` + `boxNowApiProvider.ts`): `POST /api/v1/auth-sessions` (OAuth2 client-credentials grant, с кеширане на токена до изтичане), после `POST /api/v1/delivery-requests` с `destination.locationId` = избрания `lockerId`, `origin.locationId` = склада на партньора, и `paymentMode`/`amountToBeCollected`, изведени от реалния начин на плащане (`prepaid` за карта, `cod` за наложен платеж).
  - Изисква `BOXNOW_API_URL`, `BOXNOW_OAUTH_CLIENT_ID`, `BOXNOW_OAUTH_CLIENT_SECRET`, `BOXNOW_ORIGIN_LOCATION_ID`, `BOXNOW_ORIGIN_CONTACT_NAME/EMAIL/NUMBER` (виж `.env.example`) — издадени от BOX NOW само след партньорска регистрация (integrationsupport@boxnow.bg). Никога не се hardcode-ват.
  - `getShippingProvider("box_now")` връща `BoxNowApiProvider` автоматично щом всички тези environment variables са зададени; иначе продължава да връща `BoxNowStubProvider` (демо резултат с реалния избран locker ID) — checkout-ът никога не твърди, че е подадена реална пратка, без да е.
  - **Защита срещу измислена цена**: `BoxNowApiProvider` отказва да създаде реална пратка, докато `priceBgn` в `src/config/site.ts` е `null` (TBD) — `invoiceValue`/`amountToBeCollected` в BOX NOW заявката не могат да се базират на измислена сума. Хвърля ясна грешка вместо да подаде `0.00` или друга фиктивна стойност.
  - При грешка от BOX NOW API (мрежова, 401, 400 и т.н.) `/api/checkout` връща `502` с честно съобщение за грешка — никога не превръща провалено реално извикване в фалшив "успех".
- **Webhook за събития на пратка** (CloudEvents формат) — наръчникът не документира криптографска подпис-верификация за него (за разлика от myPOS notification signing), само изисква да се предостави URL на BOX NOW. Затова webhook обработката остава извън обхвата на тази фаза — преди да се изгради, трябва да се потвърди с integrationsupport@boxnow.bg как точно се удостоверява подателят.

## Какво работи

- Пълен responsive landing funnel (13 секции) с конфигурируемо съдържание.
- Checkout демо: guest-only форма с валидация (React Hook Form + Zod), избор на количество, доставка, плащане и лично послание.
- Сървърен `/api/checkout` endpoint: валидира отново на сървъра, прекалкулира totals само от `src/config/site.ts` (никога не вярва на цена от клиента) и връща ясно обозначен демо резултат.
- Payment provider абстракция (`PaymentProvider`) с два mock провайдъра — `MyPosStubProvider` и `CashOnDeliveryProvider` — готова да се замени с реална myPOS интеграция без промяна на останалия код.
- **BOX NOW избор на автомат** — реална интеграция с официалния публичен map widget на BOX NOW (`src/components/checkout/BoxNowLockerPicker.tsx`). Клиентът вижда истински автомати (локации, адреси, наличност) от продукционните данни на BOX NOW и избира реален `lockerId` — без да са нужни partner credentials за самия widget.
- **BOX NOW реално създаване на пратка** (`BoxNowApiProvider`) — пълна имплементация на OAuth2 + `POST /api/v1/delivery-requests`, активира се автоматично щом partner credentials са зададени в environment variables (виж по-горе). Все още неактивна в тази демонстрация, защото (а) не са зададени credentials и (б) истинската цена на продукта е TBD — пратка не може да се заяви с измислена фактурна стойност.
- Unit тестове за ценообразуване, валидация, избор на payment/shipping provider, и за самия BOX NOW API клиент (мокнат `fetch`, проверка на OAuth token flow и заявката за пратка).

## Какво е мокнато / демонстрационно

- **Продуктовите снимки и 4 илюстрации** са placeholder блокове (`PlaceholderImage`), не реални изображения.
- **Цената** е `null` (TBD) в `src/config/site.ts` — никъде не се показва или изчислява измислена сума.
- **Плащанията** (карта през myPOS и наложен платеж) са изцяло симулирани — няма реален network call, няма истински credentials, никаква поръчка не се запазва извън in-memory demo repository (нулира се при рестарт).
- **Създаването на пратка с куриер** е симулирано (`CourierStubProvider`) — за куриер няма конкретен избран производствен партньор/API все още.
- **Създаването на пратка с BOX NOW** има реален код (`BoxNowApiProvider`), но е неактивно в тази демонстрация: няма partner credentials и цената е TBD, затова `getShippingProvider` връща `BoxNowStubProvider`. Изборът на автомат (widget-ът) си остава реален.
- **Доставка (куриер), връщане, FAQ детайли** съдържат placeholder текст, маркиран ясно като "предстои да се зададе" — без измислени факти, гаранции или stock urgency.

## Предстои (извън обхвата на тази фаза)

- Реална myPOS интеграция (Фаза 2): hosted payment page, верификация на нотификации по подпис съгласно официалната myPOS документация, идемпотентна обработка на webhook-и. Ще изисква sandbox/production credentials през environment variables (напр. `MYPOS_SID`, `MYPOS_WALLET_NUMBER`, `MYPOS_PRIVATE_KEY`) — никога hardcoded.
- Истинска PostgreSQL база (Railway) зад съществуващите repository интерфейси.
- Активиране на реалното създаване на пратка през BOX NOW API: кодът е готов (`BoxNowApiProvider`), но е нужна партньорска регистрация с BOX NOW (credentials) и реална цена на продукта. Webhook за проследяване на пратка остава да се изгради, след потвърждение от BOX NOW как се удостоверява подателят. Изборът на автомат вече е реален (виж по-горе).
- Реални продуктови снимки и илюстрации (логото вече е реалното от `public/brand/`).
- Реална цена и условия за доставка/връщане.
