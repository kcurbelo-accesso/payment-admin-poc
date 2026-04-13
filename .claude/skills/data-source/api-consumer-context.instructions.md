---
description: 'Technical context for the admin-api BFF merchant initialization endpoint. Apply when consuming GET /api/init, working with InitialLoadResponse, rendering components or integrations from init data, or working with locale namespaces from the init response.'
---

# admin-api BFF — Consumer Context

This project consumes data from the **admin-api BFF**, a Node.js/Express service that reshapes raw Spring Boot config data into a structured initialization payload. The primary contract this project relies on is `GET /api/init`.

---

## Calling the Endpoint

```
GET /api/init
```

### Headers

| Header | Required | Description |
|---|---|---|
| `X-Tenant-Id` | Yes | Tenant identifier (e.g. `accesso`) |
| `X-Merchant-Id` | No* | Merchant identifier |

### Query Parameters

| Param | Required | Description |
|---|---|---|
| `locale` | Yes | Language locale, e.g. `en-US`, `es-ES` |
| `sessionId` | No | Session identifier |
| `appVersion` | No | Application version string |
| `merchantId` | No* | Merchant identifier (fallback if header absent) |

*`merchantId` must be provided via the header **or** the query param — not required to be both.

### Example

```ts
const params = new URLSearchParams({ locale: 'en-US', sessionId: session.id });
const res = await fetch(`/api/init?${params}`, {
  headers: {
    'X-Tenant-Id': tenantId,
    'X-Merchant-Id': merchantId,
  },
});
const data: InitialLoadResponse = await res.json();
```

---

## Response Shape — `InitialLoadResponse`

```ts
interface InitialLoadResponse {
  merchant:           MerchantMetadata;
  applicationConfigs: ApplicationConfig[];
  navigation:         NavigationConfig;
  integrations:       IntegrationConfig[];
  locales:            LocaleBundle;
}
```

---

## Field Reference

### `merchant` — `MerchantMetadata`

Branding and identity for the current merchant.

```ts
interface MerchantMetadata {
  id:       string;       // Merchant ID (e.g. "800")
  tenantId: string;       // Tenant (e.g. "accesso")
  name:     string;       // Display name
  theme:    ThemeConfig;
}

interface ThemeConfig {
  primaryColor:   string;  // e.g. "#2E7D32"
  secondaryColor: string;
  fontFamily:     string;  // e.g. "Roboto"
  borderRadius:   string;  // e.g. "8px"
  [key: string]:  string;  // Additional theme tokens may be present
}
```

---

### `navigation` — `NavigationConfig`

Defines which pages exist, their order, and which components render on each page.

```ts
interface NavigationConfig {
  pages:       PageDefinition[];
  allowSkip:   boolean;
  showProgress: boolean;
}

interface PageDefinition {
  id:         string;               // e.g. "payment"
  route:      string;               // e.g. "/payment"
  order:      number;
  title:      string;
  enabled:    boolean;
  icon?:      string;
  layout?:    LayoutConfig;
  components: ComponentPlacement[];
}
```

#### Component Placements

Each page carries its own `components` array. Components are **conditionally included** by the BFF based on merchant config — if a component is absent, the feature is not enabled for this merchant.

```ts
interface ComponentPlacement {
  id:             string;             // e.g. "comp_payment_001"
  componentType:  ComponentType | string;
  order:          number;             // Render order on the page
  column?:        number;
  enabled:        boolean;
  features:       Record<string, any>; // Feature flags specific to this component
  localeRefs:     LocaleReference;    // Which locale namespace + keys this component uses
  styleOverrides?: Record<string, string | number | boolean>;
}
```

**Known `componentType` values:**

| Value | Description |
|---|---|
| `payment-method-selector` | Credit card, gift card, Apple Pay selector |
| `tip-selector` | Tip amount selection |
| `donation` | Donation amount picker |
| `loyalty-signup` | Loyalty program enrollment |
| `receipt-email-input` | Email input for receipt |
| `order-summary` | Order line items |
| `custom-amount-input` | Free-form amount entry |
| `terms-and-conditions` | T&C display |
| `"insurance"` | Ticket protection (TicketGuardian) |

---

### `integrations` — `IntegrationConfig[]`

Third-party services that need to be initialized. Each entry tells the consumer **what to load**, **when to load it**, and **what credentials to use**.

```ts
interface IntegrationConfig {
  id:           string;              // e.g. "int_stripe_001"
  type:         string;              // e.g. "payment", "fraud-detection", "insurance"
  provider:     string;              // e.g. "Stripe", "PayPal", "Accertify"
  enabled:      boolean;
  initStrategy: InitStrategy;
  credentials:  Record<string, string>; // e.g. { clientId, merchantId }
  settings:     Record<string, any>;    // Provider-specific settings
}

interface InitStrategy {
  timing:            'critical' | 'prefetch' | 'lazy';
  blocksRendering:   boolean;
  requiredForPages:  string[];
}
```

**`initStrategy.timing` guide for consumers:**

| Timing | When to initialize |
|---|---|
| `critical` | Before first render — blocks the page |
| `prefetch` | After critical integrations, before user interaction |
| `lazy` | On demand, when the relevant page/component is reached |

---

### `locales` — `LocaleBundle`

All locale strings for the requested language, organized by namespace (section).

```ts
interface LocaleBundle {
  locale:     string;   // e.g. "en-US"
  namespaces: Record<string, Record<string, string>>;
  // namespaces["billing"]["card_number_label"] === "Card Number"
}
```

Namespace keys map directly to `ComponentPlacement.localeRefs.namespace`. Use `localeRefs.keys` on a component to know which keys within that namespace it needs.

---

## Error Responses

| Status | Cause |
|---|---|
| `400` | Missing `merchantId` or `locale` |
| `500` | Backend service failure or non-OK status from Spring Boot |

Error body: `{ error: string, message?: string }`

---

## Integration Initialization Pattern

```ts
// Recommended consumer-side initialization sequence
const { integrations } = await fetchInitData();

const critical  = integrations.filter(i => i.initStrategy.timing === 'critical');
const prefetch  = integrations.filter(i => i.initStrategy.timing === 'prefetch');
const lazy      = integrations.filter(i => i.initStrategy.timing === 'lazy');

// Block render on critical
await Promise.all(critical.map(i => initIntegration(i)));

// Kick off prefetch in background
prefetch.forEach(i => initIntegration(i));

// Defer lazy until needed
```
