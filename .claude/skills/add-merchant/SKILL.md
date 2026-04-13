---
name: add-merchant
description: Add a new mock merchant to the apay-config-poc project. Use when asked to create a new merchant, add a merchant to a stack/tenant, or seed more mock data.
argument-hint: "[merchantId] [tenantId] [merchant name] [stack]"
allowed-tools: Read Edit Bash
---

Add a new merchant to `src/admin/data/mock.ts` following the project's established patterns.

## Arguments
$ARGUMENTS

If no arguments given, ask the user for: merchantId, tenantId, merchant name, and which stack (stack_na1, stack_cf, stack_sf, stack_meg_na).

## Context

### Company hierarchy
Stack → Tenant → Merchant (three levels).
- Dedicated stacks (stack_cf, stack_sf, stack_meg_na): 1 tenant per stack, dozens of merchants.
- Shared stacks (stack_na1, stack_na2...): many tenants sharing resources.

### Existing stacks and tenants
- `stack_na1` → tenants: `tenant_tmn`, `tenant_axs`
- `stack_cf` → tenant: `tenant_cedarfair`
- `stack_sf` → tenant: `tenant_sixflags`
- `stack_meg_na` → tenant: `tenant_merlin_na`

### Existing merchant ID ranges
- NA1: na1_001–005
- CF: cf_001–005
- SF: sf_001–004
- MEG-NA: meg_001–003

### How to add a merchant

1. Read `src/admin/data/mock.ts` to understand the current structure.
2. Create the new merchant using `makeMerchant(id, tenantId, name, { ...opts }, version)` — find a realistic set of options by looking at nearby merchants.
3. Push it into the correct `MOCK_MERCHANTS` slice (find the section for the target stack/tenant — they are grouped by tenant).
4. Ensure the merchant is included in the correct `getTenantsForStack` / `getMerchantsForTenant` lookup — these are driven by `MOCK_MERCHANTS` filtering on `tenantId`, so just the push is enough.
5. Optionally add 2–3 representative log entries to `MOCK_LOGS` referencing the new merchantId.

### `makeMerchant` signature
```ts
makeMerchant(
  id: string,
  tenantId: string,
  name: string,
  opts: {
    primaryColor?: string;
    cybersourceEnabled?: boolean;
    storedValueEnabled?: boolean;
    paypalEnabled?: boolean;
    accertifyEnabled?: boolean;
    riskManagementEnabled?: boolean;
    ticketGuardianEnabled?: boolean;
    donationEnabled?: boolean;
    insuranceEnabled?: boolean;
    payMonthlyEnabled?: boolean;
  },
  version?: string  // defaults to '1.0.0', use '1.3.0' for latest
)
```

### Version guidance
- v1.3.0 → fully up-to-date, use for flagship merchants
- v1.2.0 → missing payment controls (ignoreAvs/ignoreCvv, applyLayoutColor, SVC)
- v1.1.0 → missing pay-monthly + nav controls
- v1.0.0 → baseline only

## Steps

1. Read `src/admin/data/mock.ts` (focus on the `makeMerchant` calls and MOCK_MERCHANTS array).
2. Determine the right opts based on the tenant profile (Cedar Fair merchants tend to have storedValue + insurance; NA1 is mixed).
3. Insert the new `makeMerchant(...)` call in the correct merchant list position.
4. Run `npx tsc --noEmit` to confirm no type errors.
5. Report the new merchant's id, tenant, stack, and which features are enabled.
