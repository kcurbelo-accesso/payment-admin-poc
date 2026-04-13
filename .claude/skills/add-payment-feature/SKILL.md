---
name: add-payment-feature
description: Add a new payment feature to the paymentFeatures registry. Use when asked to add a new payment method, add-on, risk tool, or analytics integration to the app-config payment features panel.
argument-hint: "[feature key] [label] [category]"
allowed-tools: Read Edit Bash
---

Add a new `PaymentFeatureDef` entry to `src/admin/data/paymentFeatures.ts`.

## Arguments
$ARGUMENTS

If no arguments provided, ask the user for: feature key (snake_case), label (display name), category, and how it is enabled.

## Context

### Categories
`'Payment Methods' | 'Add-ons' | 'Risk & Compliance' | 'Analytics'`

### FeatureEnabledBy types
```ts
// Tied to a manifest integration being enabled (e.g. Cybersource, PayPal)
{ type: 'manifest-integration'; provider: string }

// Tied to a specific payment method group within Cybersource paymentMethods
{ type: 'manifest-integration-pm-group'; provider: 'Cybersource'; group: string }

// Enabled when an applicationConfigs row exists with this key
{ type: 'appconfig-exists'; key: string }

// Enabled when a boolean field on an applicationConfigs row is true
{ type: 'appconfig-bool'; key: string; field?: string }
```

### FieldSource types
```ts
{ type: 'appconfig-field'; key: string; field: string }
{ type: 'appconfig-scalar'; key: string }
{ type: 'manifest-integration-setting'; provider: string; setting: string; groups?: string[] }
{ type: 'manifest-integration-credential'; provider: string; credential: string }
```

### Field inputTypes
`'text' | 'boolean' | 'number' | 'select' | 'color' | 'number-array' | 'card-3ds' | 'funding-sources'`

### Known integration providers (manifest-level)
`Cybersource`, `GiftCard`, `PayPal`, `Accertify`, `RiskManagement`, `TicketGuardian`, `CustomDonationProvider`

### `manifest-integration-pm-group` notes
- Used for Apple Pay (APL) and Google Pay (GGL) — sub-groups within Cybersource's `paymentMethods`
- `defaultAppConfig` should be an array of card objects: `{ cardBrand, cardBrandCode, enabled3ds, displayOrder }`
- Toggle adds/removes the group from `settings.paymentMethods`

### `mirrorAppConfigBool`
Optional field on the feature def. When present, toggling the manifest integration also flips a corresponding applicationConfigs boolean (used by Accertify → `enable_risk_management`).

## Steps

1. Read `src/admin/data/paymentFeatures.ts` to see existing patterns.
2. Determine the correct `enabledBy` type based on where this feature lives in the schema.
3. Write the new `PaymentFeatureDef` object, inserting it in the correct category section.
4. If `enabledBy` is `appconfig-exists`, set a `defaultAppConfig` with sensible field defaults.
5. For each field, pick the correct `inputType` and `source`.
6. Run `npx tsc --noEmit` to confirm no type errors.
7. Describe what the new feature looks like in the UI and how it is toggled.
