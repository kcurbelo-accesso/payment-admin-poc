---
name: new-release-template
description: Output the GitHub release body template for a new MFE schema version. Use when cutting a new release or asking for the release notes template.
argument-hint: "[version e.g. 1.4.0] [title]"
---

Here is the GitHub release body template to paste when cutting a new MFE release.

**Version:** $ARGUMENTS

---

```markdown
## Overview
[1–2 sentence description of what this version introduces and why.]

## Changelog
### Added
- **Pages**: [Description of new pages added]
- **Components**: [Description of new component features]
- **Navigation**: [Description of navigation changes]
- **Integrations**: [Description of new integrations or integration features]
- **Theme**: [Description of new theme fields]
- **Payment Methods**: [Description of new payment method support]

### Changed
- **[Area]**: [Description of what changed and why]

### Deprecated
- **[Area]**: [Description of what is deprecated and what to use instead]

## Schema Migration
<!-- One block per new config field introduced in this version.
     Remove this section entirely if no schema fields were added or changed.
     The admin CRM parses these blocks to power the migration center. -->

### [field_id_snake_case]
- **Path**: `dot.notation.path[with.brackets]`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: global
- **Description**: What this field controls and when ops should change it from the default.

### [another_field_id]
- **Path**: `navigation.pages[page-id].components[component-type].features.fieldName`
- **Type**: text
- **Default**:
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=page-id, componentType=component-type
- **Description**: What this field controls.
```

---

## Field reference

### Valid **Area** values (use exactly as shown)
`Pages` · `Components` · `Navigation` · `Integrations` · `Theme` · `Payment Methods`

### Valid **Type** values
`boolean` · `text` · `number`

### Valid **Scope** values
`global` · `page` · `component` · `integration`

### **ScopeFilter** syntax
Comma-separated key=value pairs on one line. Omit entirely for global scope.
- `pageId=insurance`
- `pageId=pay-monthly, componentType=pay-later`
- `integrationProvider=Cybersource`

### **Path** notation
- Global config field: `merchant.theme.applyLayoutColor`
- Navigation flag: `navigation.allowSkip`
- Page-level: `navigation.pages[page-id].enabled`
- Component feature: `navigation.pages[payment].components[payment-method-selector].features.hideHeader`
- Integration setting: `integrations[Cybersource].settings.ignoreAvs`
- Integration nested: `integrations[PayPal].settings.fundingSources[venmo].enabled`

---

## How the admin CRM uses this

When you publish a GitHub release with this body:
1. The admin Releases page syncs from `MOCK_GITHUB_RELEASES` (real API when connected)
2. The parser extracts changelog items → displays in the Release Detail view
3. Migration field blocks → appear in the Migration Center for any merchant behind this version
4. Ops teams use the Migration Center to apply and publish each field update per merchant

**To update mock data before the real GitHub API is connected:**
Edit `src/admin/data/githubReleases.ts` and add a new `GitHubRelease` object following the same pattern.
