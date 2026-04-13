---
name: add-integration
description: Add a new integration provider to the manifest schema and mock data. Use when asked to add a new third-party integration (payment processor, analytics, fraud tool, etc.) to the system.
argument-hint: "[provider name] [type: payment|analytics|risk|addon]"
allowed-tools: Read Edit Bash
---

Add a new integration provider to the apay-config-poc manifest schema.

## Arguments
$ARGUMENTS

If no arguments provided, ask the user for: provider name, integration type, and which merchants should have it enabled by default.

## Context

### Integration structure in MerchantConfig
```ts
integrations: Array<{
  id: string;              // e.g. 'int_newprovider_${merchantId}'
  type: string;            // 'payment' | 'analytics' | 'risk' | 'addon'
  provider: string;        // e.g. 'NewProvider' — used as the key everywhere
  enabled: boolean;
  initStrategy: {
    timing: 'critical' | 'lazy';
    blocksRendering: boolean;
    requiredForPages: string[];
  };
  credentials: Record<string, any>;
  settings: Record<string, any>;
}>
```

### Existing providers
`Cybersource`, `GiftCard`, `PayPal`, `Accertify`, `RiskManagement`, `TicketGuardian`, `CustomDonationProvider`

### Files to update

**`src/admin/data/mock.ts`**
- Add the integration to `buildIntegrations(merchantId, opts)` function
- Add a boolean opt like `newProviderEnabled: boolean` to the opts parameter
- Pass that opt into `makeMerchant` calls for merchants that should have it

**`src/admin/data/paymentFeatures.ts`** (if it should appear in the Payment Features panel)
- Add a `PaymentFeatureDef` with `enabledBy: { type: 'manifest-integration', provider: 'NewProvider' }`
- Add relevant fields for its credentials/settings

**`src/admin/pages/merchants.ts`** (if it should appear as a matrix column)
- Add detection logic in the matrix row builder
- Add a column header and cell

### initStrategy guidance
- `critical` + `blocksRendering: true` → payment processors (Cybersource, PayPal, GiftCard)
- `critical` + `blocksRendering: false` → risk/fraud tools loaded before checkout but non-blocking
- `lazy` + `blocksRendering: false` → analytics, add-ons (Rokt, Hotjar, donation)

## Steps

1. Read `src/admin/data/mock.ts` focusing on `buildIntegrations` and `makeMerchant`.
2. Add the new integration entry to `buildIntegrations`.
3. Add the opt flag to the opts type and `makeMerchant` signature.
4. Enable it for appropriate mock merchants (e.g., only flagship merchants by default).
5. If adding to paymentFeatures, read `src/admin/data/paymentFeatures.ts` and add the feature def.
6. Run `npx tsc --noEmit` to confirm clean types.
7. Report which merchants now have the integration enabled and whether it appears in the Payment Features panel.
