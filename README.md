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

- `src/app` — страници и route handlers (App Router), вкл. `admin/` и `api/admin/*`
- `src/domain` — framework-agnostic бизнес логика (продукт, комплект/kit, количка, поръчка, доставка, плащане)
- `src/infrastructure` — заменими имплементации (mock/реални payment-shipping провайдъри, order/kit repository с Postgres-или-in-memory избор, Postgres connection pool)
- `src/components` — UI компоненти (`landing`, `checkout`, `admin`, `brand`, `ui`, `legal`)
- `src/config/site.ts` — конфигурационен обект за продукт, вариант/kit идентичности, доставка, FAQ, trust-съдържание (цена/снимки per-kit вече се настройват през `/admin/kits`, не тук)
- `src/lib` — валидация (Zod), помощни функции, admin сесии

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

## Админ панел

`/admin` (защитен от `src/proxy.ts` — пренасочва към `/admin/login` без валидна сесийна бисквитка):

- **Вход** — `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` в environment-а (виж `.env.example`); без тях входът е изцяло изключен (503), не разчита на фиктивни стойности по подразбиране.
- **Поръчки** (`/admin`) — dashboard с реални статистики (общо/днес/чакащи/потвърдени/отказани поръчки, уникални клиенти по телефон, поръчки "за напомняне" — чакащи повече от 24ч), търсене/филтри/сортиране и колона "Проследяване" от BOX NOW webhook събитията. Никога не показва измислена обща сума/revenue — цената остава "предстои да се зададе", докато не е зададена за съответния комплект.
- **Комплекти** (`/admin/kits`) — всеки вариант от `product.variants` (`src/config/site.ts`) е отделна редактируема позиция: текуща цена, стандартна (зачертана) цена, заглавна снимка и галерия. Записва се през `kitRepository` (виж по-долу) и веднага се отразява в landing страницата (`/api/kits`, публичен read-only endpoint) и в checkout обобщението.
- **Качване на снимки** (`src/app/api/admin/uploads/route.ts`) — записва на локалния диск извън `public/` (вж. коментара в `src/app/api/uploads/kits/[filename]/route.ts` защо не директно в `public/`: тази версия на Next.js компилира `public/` в build-time манифест, така че файлове, записани по време на работа, биха върнали 404 през статичния pipeline). Работи за локална разработка и single-instance deploy с персистентен диск; на платформи с ефимерна файлова система (напр. Railway без прикачен Volume) файловете се губят при redeploy — нужен е или persistent Volume, или реално object storage (S3/R2) за продукция.

## BOX NOW интеграция

Базирано на официалния "BOX NOW API Integration — Partner API" наръчник (www.boxnow.bg/en/partner-api):

- **Избор на автомат чрез dropdown** (`src/components/checkout/BoxNowLockerPicker.tsx`) — вместо вграждане на BOX NOW's официален map widget, клиентът търси по град/адрес/пощенски код в текстово поле, после избира от филтриран `<select>` списък. Данните идват от публичния, credential-free locations feed, документиран в наръчника като "по-добра производителност" алтернатива на OAuth-защитения `/destinations` call: `https://locationapi-production.boxnow.bg/v1/apms_bg-BG.json` (~940 локации в България). Проксирано през `src/app/api/box-now/lockers/route.ts` (server-side fetch, `revalidate: 3600`), за да няма CORS и за да филтрираме само локации със `state: "boxnow-ready"`.
- **Реалното REST API за създаване на пратка** вече е имплементирано (`src/infrastructure/shipping/boxNowApiClient.ts` + `boxNowApiProvider.ts`): `POST /api/v1/auth-sessions` (OAuth2 client-credentials grant, с кеширане на токена до изтичане), после `POST /api/v1/delivery-requests` с `destination.locationId` = избрания `lockerId`, `origin.locationId` = склада на партньора, и `paymentMode`/`amountToBeCollected`, изведени от реалния начин на плащане (`prepaid` за карта, `cod` за наложен платеж).
  - Изисква `BOXNOW_API_URL`, `BOXNOW_OAUTH_CLIENT_ID`, `BOXNOW_OAUTH_CLIENT_SECRET`, `BOXNOW_ORIGIN_LOCATION_ID`, `BOXNOW_ORIGIN_CONTACT_NAME/EMAIL/NUMBER` (виж `.env.example`) — издадени от BOX NOW само след партньорска регистрация (integrationsupport@boxnow.bg). Никога не се hardcode-ват.
  - `getShippingProvider("box_now")` връща `BoxNowApiProvider` автоматично щом всички тези environment variables са зададени; иначе продължава да връща `BoxNowStubProvider` (демо резултат с реалния избран locker ID) — checkout-ът никога не твърди, че е подадена реална пратка, без да е.
  - **Защита срещу измислена цена**: `BoxNowApiProvider` отказва да създаде реална пратка, докато цената на избрания комплект (вж. „Админ панел — комплекти“ по-долу) е `null` (TBD) — `invoiceValue`/`amountToBeCollected` в BOX NOW заявката не могат да се базират на измислена сума. Хвърля ясна грешка вместо да подаде `0.00` или друга фиктивна стойност.
  - При грешка от BOX NOW API (мрежова, 401, 400 и т.н.) `/api/checkout` връща `502` с честно съобщение за грешка — никога не превръща провалено реално извикване в фалшив "успех".
- **Webhook за събития на пратка** (`src/app/api/webhooks/boxnow/route.ts`) — приема реалния CloudEvents формат, документиран в "Webhook Based Parcel Tracking Guide". Наръчникът не фиксира крипто подпис-верификация (за разлика от iCard notification signing) — само изисква URL, конфигуриран заедно с BOX NOW support; затова webhook-ът проверява споделен `Authorization: Bearer` secret (`BOXNOW_WEBHOOK_SECRET`), чиято точна форма трябва да се потвърди с integrationsupport@boxnow.bg при реалната активация. Събитията се пазят в `order.shipmentEvents` и се виждат в admin dashboard-а.

## iCard интеграция

Базирано на официалния "IPG API v3.4" наръчник на iCard (Intercard Finance AD) и организацията им на GitHub (`iCardDirect`):

- **Вграден виджет за плащане** (не redirect към хоствана страница) — секция "IPG Payment Widget" от наръчника. Сървърът иска токен (`POST /paymentpage` с `IPGmethod=IPGPaymentToken`, `WidgetType=IPGPurchase`), после клиентът вгражда `<div id="ipg">` и зарежда `https://ipg.icard.com/js/payment-widget.js?token=...` — картодържателят въвежда данни директно в страницата, без пренасочване. Имплементирано в `src/components/checkout/ICardPaymentWidget.tsx`.
- **Подписване на заявки**: RSA (не HMAC) — двете страни разменят публични RSA ключове при интеграция. Подписът е SHA1 хеш на конкатенираните стойности на всички полета (без `Signature`, URL-encoded по PHP-специфичен начин), RSA-подписан и base64-кодиран. Имплементирано в `src/infrastructure/payments/icard/icardSignature.ts`, с unit тестове (round-trip подпис/верификация, засечени манипулации, грешен ред на полетата, грешен публичен ключ).
  - **Забележка**: наръчникът не показва изрично изчисление за подписа на XML отговора на `IPGPaymentToken` (само на POST заявки) — кодът прилага същия общ механизъм върху елементите на отговора (`status`, `status_msg`, `token`) по аналогия. Ако това предположение е грешно, проверката просто отказва (не приема token), никога не приема мълчешком непроверен token.
- **Изисква адрес за фактуриране и имейл** дори при доставка с BOX NOW — `IPGPurchase` изисква `BillAddr*` и `Email` като задължителни полета, независимо от начина на доставка. Формата показва отделна секция "Адрес за фактуриране", когато е избрана BOX NOW доставка с карта.
- **Webhook** (`src/app/api/webhooks/icard/route.ts`, `URL_Notify`) — обработва `IPGPurchaseNotify` (маркира поръчката като платена) и `IPGPurchaseRollback` (сторниране), идемпотентно през `IPG_Trnref`/`OrderID`. Отговаря с точния низ `"OK"`, както изисква наръчникът — всичко друго кара iCard да приеме нотификацията за неуспешна.
- **Защита срещу измислени данни**: `ICardApiProvider` отказва заявка за токен, ако цената е TBD, ако липсва `CustomerIP`, адрес за фактуриране или имейл — никога не подава фиктивни стойности към iCard.
- Изисква `ICARD_ORIGINATOR`, `ICARD_MID`, `ICARD_MID_NAME`, `ICARD_PRIVATE_KEY` (наш RSA частен ключ), `ICARD_IPG_PUBLIC_KEY` (публичният ключ на iCard) — виж `.env.example`. Разменят се с iCard само след интеграция.

## Какво работи

- Пълен responsive landing funnel (13 секции) с конфигурируемо съдържание.
- Checkout демо: guest-only форма с валидация (React Hook Form + Zod), избор на количество, доставка, плащане и лично послание.
- Сървърен `/api/checkout` endpoint: валидира отново на сървъра, прекалкулира totals само от `src/config/site.ts` (никога не вярва на цена от клиента) и връща ясно обозначен демо резултат.
- Payment provider абстракция (`PaymentProvider`) с два mock провайдъра — `ICardStubProvider` и `CashOnDeliveryProvider` — и реален провайдър `ICardApiProvider`, който се активира автоматично щом iCard credentials са зададени (виж по-горе).
- **iCard вграден виджет за плащане** — реална имплементация на RSA подписване, заявка за payment token и webhook за нотификации. Все още неактивна в тази демонстрация, защото (а) не са зададени credentials и (б) истинската цена на избрания комплект е TBD.
- **BOX NOW избор на автомат** — dropdown с търсене върху реални локации на BOX NOW (виж по-горе). Клиентът вижда истински автомати (локации, адреси) от продукционните данни на BOX NOW и избира реален `lockerId` — без да са нужни partner credentials.
- **BOX NOW реално създаване на пратка** (`BoxNowApiProvider`) — пълна имплементация на OAuth2 + `POST /api/v1/delivery-requests`, активира се автоматично щом partner credentials са зададени в environment variables (виж по-горе). Все още неактивна в тази демонстрация, защото (а) не са зададени credentials и (б) истинската цена на избрания комплект е TBD — пратка не може да се заяви с измислена фактурна стойност.
- **BOX NOW webhook за проследяване на пратка** (виж по-горе) и **admin панел** (`/admin`, `/admin/kits`) за поръчки и per-kit цени/снимки.
- Unit тестове за ценообразуване, валидация, избор на payment/shipping provider, за самия BOX NOW API клиент (мокнат `fetch`, проверка на OAuth token flow и заявката за пратка), и за iCard подписването/API клиента (RSA round-trip, манипулирани/разместени полета, мокнат `fetch`).

## Какво е мокнато / демонстрационно

- **Продуктовите снимки и 4 илюстрации** в `src/config/site.ts` са placeholder блокове (`PlaceholderImage`), не реални изображения — но всяка снимка там може да се замени с реална през `/admin/kits` (качена снимка винаги има предимство пред placeholder-а за съответния комплект).
- **Цената на всеки комплект** е `null` (TBD) по подразбиране, докато не се зададе през `/admin/kits` — никъде не се показва или изчислява измислена сума.
- **Плащанията** са изцяло симулирани в тази демонстрация — няма реален network call, няма истински credentials. Кодът за реално плащане с карта през iCard (`ICardApiProvider`) съществува, но е неактивен: няма RSA credentials, затова `getPaymentProvider` връща `ICardStubProvider`.
- **Създаването на пратка с куриер** е симулирано (`CourierStubProvider`) — за куриер няма конкретен избран производствен партньор/API все още.
- **Създаването на пратка с BOX NOW** има реален код (`BoxNowApiProvider`), но е неактивно в тази демонстрация: няма partner credentials, затова `getShippingProvider` връща `BoxNowStubProvider`. Изборът на автомат (dropdown-ът) си остава реален.
- **Поръчките** се пазят в реална Postgres база, щом зададеш `DATABASE_URL` (виж по-долу); иначе падат обратно към in-memory demo хранилище (нулира се при рестарт).
- **Доставка (куриер), връщане, FAQ детайли** съдържат placeholder текст, маркиран ясно като "предстои да се зададе" — без измислени факти, гаранции или stock urgency.

## Истинска база данни (PostgreSQL)

`src/infrastructure/repositories/orderRepository.ts` и `kitRepository.ts` следват същия "неактивен, докато не е конфигуриран" принцип: щом зададеш `DATABASE_URL` (напр. Railway Postgres plugin), и двете автоматично преминават към реална Postgres персистентност (схемата се създава сама при първо свързване — не е нужна отделна migration стъпка). Без `DATABASE_URL` — in-memory demo хранилище, нулира се при рестарт.

## Предстои (извън обхвата на тази фаза)

- Активиране на реалното плащане през iCard: кодът е готов (`ICardApiProvider` + вграден widget + webhook), но е нужна истинска цена на комплекта (през `/admin/kits`) и размяна на RSA ключове/credentials с iCard при интеграция.
- Активиране на реалното създаване на пратка през BOX NOW API: кодът е готов (`BoxNowApiProvider` + webhook), но е нужна партньорска регистрация с BOX NOW (credentials) и реална цена на комплекта. Точната форма на webhook автентикацията трябва да се потвърди с BOX NOW support. Изборът на автомат вече е реален (виж по-горе).
- Реални продуктови снимки и илюстрации — инфраструктурата (`/admin/kits`, качване на файлове) вече съществува; липсват само самите снимки.
- Реална цена (вече настройваема per-kit през `/admin/kits`) и условия за доставка/връщане.
- Реално object storage (S3/R2 и т.н.) или persistent Volume за админ-качените снимки, ако се очаква deploy без персистентен локален диск.
