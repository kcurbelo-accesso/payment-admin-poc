// Mock GitHub Releases API response — mirrors GET /repos/{owner}/{repo}/releases
// Shape matches the real GitHub API. When connecting to a real repo, replace
// MOCK_GITHUB_RELEASES with the result of that API call and nothing else changes.

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

export const GITHUB_REPO = 'acme-org/simple-checkout';

export const MOCK_GITHUB_RELEASES: GitHubRelease[] = [
  {
    id: 1001,
    tag_name: 'v1.0.0',
    name: 'v1.0.0 — Baseline Schema',
    published_at: '2025-01-15T10:00:00Z',
    html_url: 'https://github.com/acme-org/simple-checkout/releases/tag/v1.0.0',
    prerelease: false,
    draft: false,
    body: `## Overview
Initial manifest schema establishing the merchant, navigation, and integration contract for the payment MFE.

## Changelog
### Added
- **Theme**: Merchant theme: primaryColor, secondaryColor, fontFamily, borderRadius
- **Pages**: Payment page with payment component (credit card flow)
- **Integrations**: Cybersource payment integration
- **Integrations**: Accertify fraud-detection integration
- **Integrations**: RiskManagement fraud-detection integration
- **Navigation**: navigation.currentPageIndex`,
  },
  {
    id: 1002,
    tag_name: 'v1.1.0',
    name: 'v1.1.0 — Insurance & Donation',
    published_at: '2025-06-01T10:00:00Z',
    html_url: 'https://github.com/acme-org/simple-checkout/releases/tag/v1.1.0',
    prerelease: false,
    draft: false,
    body: `## Overview
Introduced the insurance page with TicketGuardian support, a reusable donation component, and their respective integrations.

## Changelog
### Added
- **Pages**: Insurance page (route: /insurance)
- **Components**: donation component: amounts[], enableRounding, roundingMultiple, enableCustomAmount, splitDonation
- **Components**: insurance component: apiKey, splitInsurance
- **Integrations**: TicketGuardian insurance integration (splitInsurance setting)
- **Integrations**: CustomDonationProvider donation integration

## Schema Migration

### ins_page_enabled
- **Path**: \`navigation.pages[insurance].enabled\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: page
- **ScopeFilter**: pageId=insurance
- **Description**: The insurance page is now available. Set whether this merchant should display the insurance step.

### donation_amounts
- **Path**: \`navigation.pages[insurance].components[donation].features.amounts\`
- **Type**: text
- **Default**: [1, 2, 5]
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=insurance, componentType=donation
- **Description**: Default donation amount options shown to the customer.

### donation_enable_rounding
- **Path**: \`navigation.pages[insurance].components[donation].features.enableRounding\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=insurance, componentType=donation
- **Description**: Allow the customer to round up their total and donate the difference.

### donation_custom_amount
- **Path**: \`navigation.pages[insurance].components[donation].features.enableCustomAmount\`
- **Type**: boolean
- **Default**: true
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=insurance, componentType=donation
- **Description**: Let customers type a custom donation amount instead of selecting from presets.

### insurance_split
- **Path**: \`navigation.pages[insurance].components[insurance].features.splitInsurance\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=insurance, componentType=insurance
- **Description**: Whether the insurance premium is split across the order items.

### tg_split_insurance
- **Path**: \`integrations[TicketGuardian].settings.splitInsurance\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: integration
- **ScopeFilter**: integrationProvider=TicketGuardian
- **Description**: Controls split insurance behavior at the TicketGuardian integration level.`,
  },
  {
    id: 1003,
    tag_name: 'v1.2.0',
    name: 'v1.2.0 — Pay Monthly + Nav Controls',
    published_at: '2025-10-15T10:00:00Z',
    html_url: 'https://github.com/acme-org/simple-checkout/releases/tag/v1.2.0',
    prerelease: false,
    draft: false,
    body: `## Overview
Added pay-monthly installment page, PayPal funding sources with granular enable/disable control, and global navigation UX flags.

## Changelog
### Added
- **Pages**: Pay Monthly page (route: /pay-monthly) with pay-later component
- **Components**: pay-later component: apiKey feature
- **Navigation**: navigation.showProgress — show step progress indicator
- **Navigation**: navigation.allowSkip — allow customers to skip optional steps
- **Integrations**: PayPal funding sources now include per-source enabled flag
### Changed
- **Integrations**: PayPal fundingSources: each source gains an \`enabled\` boolean field

## Schema Migration

### show_progress
- **Path**: \`navigation.showProgress\`
- **Type**: boolean
- **Default**: true
- **Required**: true
- **Scope**: global
- **Description**: Display a step progress bar across the top of the checkout flow.

### allow_skip
- **Path**: \`navigation.allowSkip\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: global
- **Description**: Allow customers to skip optional steps in the checkout flow.

### pay_monthly_enabled
- **Path**: \`navigation.pages[pay-monthly].enabled\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: page
- **ScopeFilter**: pageId=pay-monthly
- **Description**: Show the pay-monthly installment step in the checkout flow.

### flexpay_api_key
- **Path**: \`navigation.pages[pay-monthly].components[pay-later].features.apiKey\`
- **Type**: text
- **Default**:
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=pay-monthly, componentType=pay-later
- **Description**: Sandbox or production API key for the pay-later / FlexPay integration.

### paypal_venmo_enabled
- **Path**: \`integrations[PayPal].settings.fundingSources[venmo].enabled\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: integration
- **ScopeFilter**: integrationProvider=PayPal
- **Description**: Add Venmo as an enabled PayPal funding source for eligible merchants.`,
  },
  {
    id: 1004,
    tag_name: 'v1.3.0',
    name: 'v1.3.0 — Payment Controls',
    published_at: '2026-04-01T10:00:00Z',
    html_url: 'https://github.com/acme-org/simple-checkout/releases/tag/v1.3.0',
    prerelease: false,
    draft: false,
    body: `## Overview
Granular payment method controls, theme layout coloring, and fraud compliance settings for Cybersource and GiftCard.

## Changelog
### Added
- **Components**: payment-method-selector: hideHeader feature flag
- **Components**: payment-method-selector: skipPaymentSelection feature flag
- **Components**: payment-method-selector: fullDemographicMethods feature flag
- **Integrations**: Cybersource: ignoreAvs setting (AVS check bypass)
- **Integrations**: Cybersource: ignoreCvv setting (CVV check bypass)
- **Integrations**: GiftCard: ignoreAvs and ignoreCvv settings
- **Theme**: merchant.theme.applyLayoutColor — apply primary color to page layout chrome
### Deprecated
- **Integrations**: PayPal paylater funding source style field (will be removed in v2.0)

## Schema Migration

### hide_header
- **Path**: \`navigation.pages[payment].components[payment-method-selector].features.hideHeader\`
- **Type**: boolean
- **Default**: true
- **Required**: true
- **Scope**: component
- **ScopeFilter**: pageId=payment, componentType=payment-method-selector
- **Description**: Whether to hide the header label above the payment method selector component.

### skip_payment_selection
- **Path**: \`navigation.pages[payment].components[payment-method-selector].features.skipPaymentSelection\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: component
- **ScopeFilter**: pageId=payment, componentType=payment-method-selector
- **Description**: Auto-select the first available payment method and skip the selection screen.

### full_demographic
- **Path**: \`navigation.pages[payment].components[payment-method-selector].features.fullDemographicMethods\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: component
- **ScopeFilter**: pageId=payment, componentType=payment-method-selector
- **Description**: Enable full demographic payment methods (region-specific options). Set to null to use platform defaults.

### cs_ignore_avs
- **Path**: \`integrations[Cybersource].settings.ignoreAvs\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: integration
- **ScopeFilter**: integrationProvider=Cybersource
- **Description**: Bypass Address Verification System check. Only disable if AVS is managed upstream.

### cs_ignore_cvv
- **Path**: \`integrations[Cybersource].settings.ignoreCvv\`
- **Type**: boolean
- **Default**: false
- **Required**: true
- **Scope**: integration
- **ScopeFilter**: integrationProvider=Cybersource
- **Description**: Bypass CVV verification. Only disable in markets where CVV collection is restricted.

### sv_ignore_avs
- **Path**: \`integrations[GiftCard].settings.ignoreAvs\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: integration
- **ScopeFilter**: integrationProvider=GiftCard
- **Description**: Bypass AVS check for stored value card payments.

### apply_layout_color
- **Path**: \`merchant.theme.applyLayoutColor\`
- **Type**: boolean
- **Default**: false
- **Required**: false
- **Scope**: global
- **Description**: Apply the merchant primary color to the checkout page layout chrome (header, background accents).`,
  },
];
