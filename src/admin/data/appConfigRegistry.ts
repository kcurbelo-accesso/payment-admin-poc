/** Mirrors one row from the application_configs DB table. */
export interface AppConfigRow {
  name: string;
  value: any;
}

export type AppConfigSection = 'integrations' | 'payment' | 'donations' | 'ui' | 'validation' | 'advanced';

export interface AppConfigSubFieldDef {
  key: string;
  label: string;
  description?: string;
  inputType: 'boolean' | 'text' | 'number' | 'select' | 'color' | 'json' | 'number-array';
  defaultValue?: any;
  options?: { value: string; label: string }[];
  min?: number;
  warning?: string;
  readOnly?: boolean;
}

export interface AppConfigFieldDef {
  key: string;
  label: string;
  description: string;
  section: AppConfigSection;
  /** Top-level input type. 'object' = has nested sub-fields. */
  inputType: 'boolean' | 'text' | 'number' | 'select' | 'object';
  defaultValue?: any;
  fields?: AppConfigSubFieldDef[];
  options?: { value: string; label: string }[];
  min?: number;
  warning?: string;
  readOnly?: boolean;
}

export const APP_CONFIG_SECTIONS: { id: AppConfigSection; label: string }[] = [
  { id: 'integrations', label: 'Integrations' },
  { id: 'payment', label: 'Payment' },
  { id: 'donations', label: 'Donations' },
  { id: 'ui', label: 'UI & Locale' },
  { id: 'validation', label: 'Validation' },
  { id: 'advanced', label: 'Advanced' },
];

export const APP_CONFIG_REGISTRY: Record<string, AppConfigFieldDef> = {
  // ── Integrations ─────────────────────────────────────────────────────────────
  paypal: {
    key: 'paypal',
    label: 'PayPal',
    description: 'PayPal SDK configuration including client credentials and funding sources.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'clientId', label: 'Client ID', inputType: 'text' },
      { key: 'locale', label: 'Locale', inputType: 'text', defaultValue: 'en_US' },
      { key: 'fundingSources', label: 'Funding Sources', inputType: 'json', description: 'Array of funding source objects with source and optional style.' },
    ],
  },
  uplift: {
    key: 'uplift',
    label: 'Uplift (Pay Later)',
    description: 'Uplift BNPL integration credentials.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'apiKey', label: 'API Key', inputType: 'text' },
      { key: 'upliftId', label: 'Uplift ID', inputType: 'text' },
    ],
  },
  trustly: {
    key: 'trustly',
    label: 'Trustly',
    description: 'Trustly open banking payment integration.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'accessId', label: 'Access ID', inputType: 'text' },
    ],
  },
  ticketGuardian: {
    key: 'ticketGuardian',
    label: 'TicketGuardian',
    description: 'TicketGuardian event insurance integration.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'apiKey', label: 'API Key', inputType: 'text' },
      { key: 'currency', label: 'Currency', inputType: 'text' },
      { key: 'locale', label: 'Locale', inputType: 'text' },
      { key: 'splitInsurance', label: 'Split Insurance', inputType: 'boolean', defaultValue: false },
    ],
  },
  recaptchav3: {
    key: 'recaptchav3',
    label: 'reCAPTCHA v3',
    description: 'Google reCAPTCHA v3 bot protection.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'enabled', label: 'Enabled', inputType: 'boolean', defaultValue: false },
      { key: 'key', label: 'Site Key', inputType: 'text' },
      { key: 'enterprise', label: 'Enterprise', inputType: 'boolean', defaultValue: false },
    ],
  },
  amazon_pay: {
    key: 'amazon_pay',
    label: 'Amazon Pay',
    description: 'Amazon Pay checkout integration.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'clientKey', label: 'Client Key', inputType: 'text' },
      { key: 'merchantId', label: 'Merchant ID', inputType: 'text' },
      { key: 'region', label: 'Region', inputType: 'text' },
      { key: 'locale', label: 'Locale', inputType: 'text' },
      { key: 'buttonColor', label: 'Button Color', inputType: 'color' },
    ],
  },
  rokt: {
    key: 'rokt',
    label: 'Rokt',
    description: 'Rokt post-transaction engagement widget.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'accountId', label: 'Account ID', inputType: 'text' },
      { key: 'enable', label: 'Enabled', inputType: 'boolean', defaultValue: false },
      { key: 'identifier', label: 'Page Identifiers', inputType: 'json', description: 'Object with paymentMethodPage and creditCardPage keys.' },
    ],
  },
  risk_management: {
    key: 'risk_management',
    label: 'Risk Management',
    description: 'Risk management service credentials.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'clientId', label: 'Client ID', inputType: 'text' },
    ],
  },
  enable_risk_management: {
    key: 'enable_risk_management',
    label: 'Enable Risk Management',
    description: 'Activates risk management scoring on transactions.',
    section: 'integrations',
    inputType: 'boolean',
    defaultValue: false,
  },
  hotjar: {
    key: 'hotjar',
    label: 'Hotjar',
    description: 'Hotjar session recording and heatmap analytics.',
    section: 'integrations',
    inputType: 'object',
    fields: [
      { key: 'enabled', label: 'Enabled', inputType: 'boolean', defaultValue: false },
      { key: 'debug_mode', label: 'Debug Mode', inputType: 'boolean', defaultValue: false },
    ],
  },
  adyenClientKey: {
    key: 'adyenClientKey',
    label: 'Adyen Client Key',
    description: 'Public client key for the Adyen Web Drop-in SDK.',
    section: 'integrations',
    inputType: 'text',
  },
  adyenPaymentMethodResponse: {
    key: 'adyenPaymentMethodResponse',
    label: 'Adyen Payment Method Response',
    description: 'Cached /paymentMethods response from Adyen. Externally sourced — read only.',
    section: 'integrations',
    inputType: 'object',
    readOnly: true,
    fields: [
      { key: 'paymentMethods', label: 'Payment Methods', inputType: 'json', readOnly: true },
      { key: 'group', label: 'Groups', inputType: 'json', readOnly: true },
    ],
  },

  // ── Payment ───────────────────────────────────────────────────────────────────
  gift_card: {
    key: 'gift_card',
    label: 'Gift Card',
    description: 'Gift card entry behaviour per merchant.',
    section: 'payment',
    inputType: 'object',
    fields: [
      {
        key: 'max_entries',
        label: 'Max Gift Cards',
        inputType: 'number',
        defaultValue: 3,
        min: 1,
        warning: 'Siriusware merchants must not exceed 3 — hard backend constraint.',
      },
      { key: 'pin_required', label: 'PIN Always Required', inputType: 'boolean', defaultValue: false },
      {
        key: 'pin_default',
        label: 'PIN Default',
        inputType: 'select',
        options: [
          { value: 'yes', label: 'Yes — show PIN field by default' },
          { value: 'no', label: 'No — hide PIN field by default' },
        ],
      },
    ],
  },
  payment_method_selection: {
    key: 'payment_method_selection',
    label: 'Payment Method Selection',
    description: 'Controls the payment method selection screen.',
    section: 'payment',
    inputType: 'object',
    fields: [
      { key: 'bannerImage', label: 'Banner Image URL', inputType: 'text' },
      { key: 'hidePayments', label: 'Hide Payment Methods', inputType: 'text', description: 'Comma-separated payment method codes to hide.' },
      { key: 'recurringHidePayments', label: 'Hide for Recurring', inputType: 'text', description: 'Codes to hide for recurring transactions.' },
    ],
  },
  voucher: {
    key: 'voucher',
    label: 'Voucher',
    description: 'Voucher / promotional code configuration.',
    section: 'payment',
    inputType: 'object',
    fields: [
      { key: 'maxEntries', label: 'Max Vouchers', inputType: 'number', defaultValue: 3, min: 1 },
    ],
  },
  require_stored_cvv: {
    key: 'require_stored_cvv',
    label: 'Require Stored CVV',
    description: 'Require CVV re-entry when using a stored card.',
    section: 'payment',
    inputType: 'boolean',
    defaultValue: false,
  },
  use_payment_auth: {
    key: 'use_payment_auth',
    label: 'Use Payment Auth',
    description: 'Use authorisation flow instead of direct charge.',
    section: 'payment',
    inputType: 'boolean',
    defaultValue: false,
  },
  enable_dynamic_3ds: {
    key: 'enable_dynamic_3ds',
    label: 'Enable Dynamic 3DS',
    description: 'Dynamic 3D Secure challenge decisions based on risk signals.',
    section: 'payment',
    inputType: 'boolean',
    defaultValue: false,
  },
  disable_proxy: {
    key: 'disable_proxy',
    label: 'Disable Proxy',
    description: 'Disable the payment proxy for specific methods.',
    section: 'payment',
    inputType: 'object',
    fields: [
      { key: 'flexpay', label: 'Disable for FlexPay', inputType: 'boolean', defaultValue: false },
    ],
  },
  enableSkipPaymentSelection: {
    key: 'enableSkipPaymentSelection',
    label: 'Skip Payment Selection',
    description: 'Bypass payment method selection when only one method is available.',
    section: 'payment',
    inputType: 'boolean',
    defaultValue: false,
  },
  hide_creditcard_header: {
    key: 'hide_creditcard_header',
    label: 'Hide Credit Card Header',
    description: 'Hide the header on the credit card entry form.',
    section: 'payment',
    inputType: 'boolean',
    defaultValue: false,
  },
  showClearPayLogo: {
    key: 'showClearPayLogo',
    label: 'Show ClearPay Logo',
    description: 'Display the ClearPay BNPL logo on the payment screen.',
    section: 'payment',
    inputType: 'boolean',
  },
  cart_summary: {
    key: 'cart_summary',
    label: 'Cart Summary',
    description: 'Controls cart summary panel visibility.',
    section: 'payment',
    inputType: 'object',
    fields: [
      { key: 'hide', label: 'Hide Cart Summary', inputType: 'boolean', defaultValue: false },
    ],
  },

  // ── Donations ─────────────────────────────────────────────────────────────────
  donation: {
    key: 'donation',
    label: 'Donation',
    description: 'Donation component configuration and preset amounts.',
    section: 'donations',
    inputType: 'object',
    fields: [
      { key: 'amounts', label: 'Preset Amounts', inputType: 'number-array', description: 'Selectable donation amounts shown to the guest.' },
      { key: 'enableRounding', label: 'Enable Rounding', inputType: 'boolean', defaultValue: false },
      { key: 'enableCustomAmount', label: 'Enable Custom Amount', inputType: 'boolean', defaultValue: false },
      { key: 'splitDonation', label: 'Split Donation', inputType: 'boolean', defaultValue: false },
      { key: 'autoSelectRoundUp', label: 'Auto-select Round-up', inputType: 'boolean', defaultValue: false },
      { key: 'displayTotals', label: 'Display Totals', inputType: 'boolean', defaultValue: false },
      { key: 'fullPageDisplay', label: 'Full Page Display', inputType: 'boolean', defaultValue: false },
      { key: 'prioritize', label: 'Prioritize Donation Step', inputType: 'boolean', defaultValue: false },
      { key: 'roundingMultiple', label: 'Rounding Multiple', inputType: 'number', defaultValue: 1 },
      { key: 'minDonationAmount', label: 'Min Amount ($)', inputType: 'number', defaultValue: 0, min: 0 },
      { key: 'maxDonationAmount', label: 'Max Amount ($)', inputType: 'number', min: 0 },
    ],
  },
  donation_banner_image: {
    key: 'donation_banner_image',
    label: 'Donation Banner Image',
    description: 'URL of the banner image shown on the donation screen.',
    section: 'donations',
    inputType: 'text',
  },

  // ── UI & Locale ───────────────────────────────────────────────────────────────
  default_country_code: {
    key: 'default_country_code',
    label: 'Default Country Code',
    description: 'Default country for address and phone fields.',
    section: 'ui',
    inputType: 'text',
    defaultValue: 'US',
  },
  default_phone_code: {
    key: 'default_phone_code',
    label: 'Default Phone Code',
    description: 'Default telephone country dialling code.',
    section: 'ui',
    inputType: 'text',
    defaultValue: '1',
  },
  preferredCountryCodes: {
    key: 'preferredCountryCodes',
    label: 'Preferred Country Codes',
    description: 'Comma-separated ISO country codes shown at the top of the country selector.',
    section: 'ui',
    inputType: 'text',
    defaultValue: 'US',
  },
  preferredPhoneCountryCodes: {
    key: 'preferredPhoneCountryCodes',
    label: 'Preferred Phone Country Codes',
    description: 'Comma-separated dialling codes shown at the top of the phone country selector.',
    section: 'ui',
    inputType: 'text',
    defaultValue: '1',
  },
  enhanced_phone_number: {
    key: 'enhanced_phone_number',
    label: 'Enhanced Phone Number',
    description: 'International phone number input with country code picker.',
    section: 'ui',
    inputType: 'object',
    fields: [
      { key: 'use_enhanced_phone_number', label: 'Enable Enhanced Phone', inputType: 'boolean', defaultValue: false },
      { key: 'display_with_flags', label: 'Show Country Flags', inputType: 'boolean', defaultValue: false },
    ],
  },
  applyAppLayoutColor: {
    key: 'applyAppLayoutColor',
    label: 'Apply App Layout Color',
    description: 'Apply the merchant primary color to the app layout background.',
    section: 'ui',
    inputType: 'boolean',
    defaultValue: false,
  },
  hideExtrasHeader: {
    key: 'hideExtrasHeader',
    label: 'Hide Extras Header',
    description: 'Hide the header on the extras/upsell screen.',
    section: 'ui',
    inputType: 'boolean',
    defaultValue: false,
  },
  merchant_name: {
    key: 'merchant_name',
    label: 'Merchant Name Override',
    description: 'Display name override shown in the checkout UI.',
    section: 'ui',
    inputType: 'text',
  },
  assetsPath: {
    key: 'assetsPath',
    label: 'Assets Path',
    description: 'Base URL for merchant-specific static assets.',
    section: 'ui',
    inputType: 'text',
  },
  disable_copy_to_billing: {
    key: 'disable_copy_to_billing',
    label: 'Disable Copy to Billing',
    description: 'Hide the "copy shipping to billing" checkbox on the address form.',
    section: 'ui',
    inputType: 'boolean',
    defaultValue: false,
  },

  // ── Validation ────────────────────────────────────────────────────────────────
  disable_zip_code_validation: {
    key: 'disable_zip_code_validation',
    label: 'Disable ZIP Code Validation',
    description: 'Skip postal code format validation on the address form.',
    section: 'validation',
    inputType: 'boolean',
    defaultValue: false,
  },
  disable_field_pattern_validation: {
    key: 'disable_field_pattern_validation',
    label: 'Disable Field Pattern Validation',
    description: 'Comma-separated field names to skip regex pattern validation on.',
    section: 'validation',
    inputType: 'text',
  },
  disableMinPhoneLength: {
    key: 'disableMinPhoneLength',
    label: 'Disable Min Phone Length',
    description: 'Skip minimum length check on phone number fields.',
    section: 'validation',
    inputType: 'boolean',
    defaultValue: false,
  },
  pinCodeValidation: {
    key: 'pinCodeValidation',
    label: 'PIN Code Validation',
    description: 'Enable strict format validation on PIN code fields.',
    section: 'validation',
    inputType: 'boolean',
    defaultValue: false,
  },

  // ── Advanced ──────────────────────────────────────────────────────────────────
  cybersource_session_timeout: {
    key: 'cybersource_session_timeout',
    label: 'Cybersource Session Timeout (ms)',
    description: 'Timeout in milliseconds for the Cybersource payment session. Minimum 60,000.',
    section: 'advanced',
    inputType: 'number',
    defaultValue: 600000,
    min: 60000,
  },
  hitCallbackTimeout: {
    key: 'hitCallbackTimeout',
    label: 'Hit Callback Timeout (ms)',
    description: 'Timeout for the analytics hit callback.',
    section: 'advanced',
    inputType: 'number',
  },
  overrideMbWayMaxAmount: {
    key: 'overrideMbWayMaxAmount',
    label: 'MB Way Max Amount Override',
    description: 'Override the maximum transaction amount allowed for MB Way payments.',
    section: 'advanced',
    inputType: 'number',
  },
  poll_interval: {
    key: 'poll_interval',
    label: 'Poll Interval (ms)',
    description: 'Interval for polling pending transaction status.',
    section: 'advanced',
    inputType: 'number',
  },
  qr_code_expiry: {
    key: 'qr_code_expiry',
    label: 'QR Code Expiry (s)',
    description: 'Time in seconds before a generated QR code expires.',
    section: 'advanced',
    inputType: 'number',
  },
  saleCycleMerchant: {
    key: 'saleCycleMerchant',
    label: 'SaleCycle Merchant ID',
    description: 'SaleCycle abandoned basket tracking merchant identifier.',
    section: 'advanced',
    inputType: 'text',
  },
  fullDemographicPaymentMethods: {
    key: 'fullDemographicPaymentMethods',
    label: 'Full Demographic Payment Methods',
    description: 'Comma-separated payment method codes requiring full demographic data collection.',
    section: 'advanced',
    inputType: 'text',
  },
};
