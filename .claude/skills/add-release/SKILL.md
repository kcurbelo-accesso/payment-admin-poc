---
name: add-release
description: Add a new schema release version to the releases registry. Use when asked to define a new MFE schema version, add a release entry, or extend the migration center with a new version.
argument-hint: "[version e.g. 1.4.0] [title]"
allowed-tools: Read Edit Bash
---

Add a new `SchemaRelease` entry to `src/admin/data/releases.ts`.

## Arguments
$ARGUMENTS

If no arguments provided, ask for: version number, release title, and what new fields/features it introduces.

## Context

### Release data structure
```ts
interface SchemaRelease {
  version: string;           // e.g. '1.4.0'
  date: string;              // ISO date string
  title: string;             // Short title e.g. 'Payment Controls'
  description: string;       // 1-2 sentence summary
  changelog: {
    type: 'added' | 'changed' | 'deprecated';
    area: string;            // e.g. 'Payment Methods', 'Navigation', 'Theme', 'Integrations'
    description: string;
  }[];
  migrations: MigrationField[];
}

interface MigrationField {
  id: string;                // unique snake_case id
  title: string;
  description: string;
  path: string;              // dot-notation path in the config e.g. 'navigation.allowSkip'
  defaultValue: any;
  required: boolean;
  scope?: 'global' | 'page' | 'component' | 'integration';
  scopeFilter?: {
    pageId?: string;         // e.g. 'pay-monthly'
    componentType?: string;  // e.g. 'pay-later'
    integrationProvider?: string; // e.g. 'Cybersource'
  };
  inputType: 'boolean' | 'text' | 'number';
}
```

### Existing releases (do not modify these)
- `v1.0.0` (2025-01-15) — Baseline: merchant, payment page, Cybersource/Accertify/RiskManagement
- `v1.1.0` (2025-06-01) — Insurance & Donation: donation component, insurance component, TicketGuardian, CustomDonationProvider
- `v1.2.0` (2025-10-15) — Pay Monthly + Nav Controls: pay-monthly page, pay-later component, navigation.showProgress, navigation.allowSkip, PayPal integration
- `v1.3.0` (2026-04-01) — Payment Controls (current/latest): payment-method-selector features, Cybersource ignoreAvs/ignoreCvv, merchant.theme.applyLayoutColor, StoredValue SVC

### Migration field guidance
- Only include fields that are **new** in this version (not present in prior versions)
- `path` should match the actual MerchantConfig shape in `src/admin/data/mock.ts`
- Use `scope: 'integration'` + `scopeFilter.integrationProvider` for fields that only apply when a provider is enabled
- `required: true` means ops must fill it in before publishing; `false` means optional/has safe default

### Merchant version field
- After a migration is applied and published, `config.version` is bumped to the target release version
- The releases page migration center shows all merchants whose `config.version < latest`

## Steps

1. Read `src/admin/data/releases.ts` to see existing release structure.
2. Determine where in the array to insert the new release (ordered oldest → newest, new release goes at the end).
3. Write the `SchemaRelease` object with changelog entries and migration fields.
4. If this release introduces a new `config.version` string, also update `src/admin/data/mock.ts` — add the new version string to any merchants you want to seed at the new version.
5. Run `npx tsc --noEmit` to confirm clean types.
6. Summarize what the new release introduces and how many merchants the migration center will flag as behind.
