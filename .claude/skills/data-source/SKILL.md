---
description: "Spring Boot data pipeline — how the new aggregation endpoint pulls from multiple sources and builds InitialLoadResponse. Apply when working with applicationConfigs, locales, integrations, payment configuration, or the admin overlay merge."
user-invocable: false
---

## Architecture

A new Spring Boot endpoint aggregates data from multiple internal sources and returns a single structured payload the frontend uses to build layout, load services, and resolve locales.

The Node.js BFF layer (`admin-api`, `general.util.ts`) previously handled this aggregation — that responsibility is moving into Spring Boot.

---

## Data Flow (Input → Output)

```
New Spring Boot endpoint (GET /api/init or equivalent)
  │
  ├── Source: ApplicationConfigs DB   → ApplicationConfig[]  (flat { id, name, value })
  ├── Source: ApplicationLocale DB    → ApplicationLocale[]  (flat { language, section, name, value })
  ├── Source: PaymentConfiguration DB → PaymentConfig[]
  └── Source: Admin overlay store     → ops-managed overrides (theme, page toggles, integration toggles, feature flags)
  │
  Builder logic (Spring Boot)
        ├── buildMerchantMetadata()  → MerchantMetadata
        ├── buildNavigation()        → NavigationConfig
        │     └── buildComponents()  → ComponentPlacement[]
        ├── buildIntegrations()      → IntegrationConfig[]
        │     └── buildPaymentIntegration() (per provider)
        └── buildLocales()           → LocaleBundle
  │
  InitialLoadResponse (returned to frontend)
        ├── merchant
        ├── applicationConfigs
        ├── navigation
        ├── integrations
        └── locales
```

---

## Admin Overlay

The admin CRM (this POC) writes ops-managed config to a separate store. The Spring Boot endpoint reads both the base config and the admin overlay at request time, merging them before building the response. This is the mechanism by which the admin controls theme, page/component visibility, integration toggles, and feature flags without touching the base application config records.

---

## Mock relationship

The mock in `src/admin/data/mock.ts` simulates the already-shaped Spring Boot output — it skips the raw source layer and produces `MerchantConfig` objects that match `InitialLoadResponse` directly. Builder functions in mock.ts (`buildMerchantConfig`, `buildPages`, `buildIntegrations`) mirror what the Spring Boot builders will produce.
