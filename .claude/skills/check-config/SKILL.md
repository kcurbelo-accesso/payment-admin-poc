---
name: check-config
description: Audit and report the current state of a merchant's config — enabled features, version, pages, integrations, and any issues. Use when asked to inspect, summarize, or debug a merchant's configuration.
argument-hint: "[merchantId or merchant name]"
allowed-tools: Read Grep Bash
---

Audit the configuration for a specific merchant in the apay-config-poc mock data.

## Arguments
$ARGUMENTS

If no merchant is specified, list all available merchant IDs and ask which one to inspect.

## Context

### Where merchant configs live
All merchants are defined via `makeMerchant(...)` in `src/admin/data/mock.ts`.
The `MerchantConfig` shape includes:
- `merchant` — id, tenantId, name, theme, version
- `navigation.pages[]` — only **enabled** pages are in the array (disabled = absent)
- `integrations[]` — all integrations present, each has `enabled: boolean`
- `applicationConfigs[]` — row-based app config entries
- `featureFlags[]` — convenience ops flags

### Version meanings
- `1.3.0` — fully up to date (latest)
- `1.2.0` — missing: ignoreAvs/ignoreCvv, applyLayoutColor, SVC payment method
- `1.1.0` — missing: pay-monthly page, nav controls
- `1.0.0` — baseline only

### Key integration providers
`Cybersource`, `GiftCard`, `PayPal`, `Accertify`, `RiskManagement`, `TicketGuardian`, `CustomDonationProvider`

### Feature flag keys
`skipPayment`, `enable3ds`, `guestCheckout`, `splitPayment`, `saveCard`

## Steps

1. Read `src/admin/data/mock.ts` and locate the merchant by id or name.
2. Report:
   - **Identity**: id, tenantId, stack, name, version
   - **Theme**: primaryColor, fontFamily, borderRadius, applyLayoutColor
   - **Pages**: which pages are in the navigation array (insurance / pay-monthly / payment)
   - **Components**: per page, which components are enabled and their key features
   - **Integrations**: list each integration, enabled status, key settings (paymentMethods for Cybersource, fundingSources for PayPal)
   - **App Configs**: list all applicationConfigs rows
   - **Feature Flags**: list all featureFlags and their enabled state
3. Flag any potential issues:
   - Version behind latest (< 1.3.0)
   - Cybersource enabled but no paymentMethods defined
   - PayPal enabled but no clientId
   - 3DS feature flag on but no card brands have enabled3ds
   - Insurance page present but TicketGuardian integration disabled
4. Summarize in plain English what this merchant's checkout experience looks like.
