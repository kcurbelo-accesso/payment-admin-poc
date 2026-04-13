import type { MerchantConfig } from './mock';

// ── Source types ──────────────────────────────────────────────────────────────

export type FeatureEnabledBy =
  | { type: 'manifest-integration'; provider: string }
  | { type: 'manifest-integration-pm-group'; provider: string; group: string }
  | { type: 'appconfig-exists'; key: string }
  | { type: 'appconfig-bool'; key: string; field?: string };

export type FieldSource =
  | { type: 'appconfig-field'; key: string; field: string }
  | { type: 'appconfig-scalar'; key: string }
  | { type: 'manifest-integration-setting'; provider: string; setting: string; groups?: string[] }
  | { type: 'manifest-integration-credential'; provider: string; credential: string };

// ── Field definition ──────────────────────────────────────────────────────────

export interface PaymentFeatureFieldDef {
  key: string;
  label: string;
  description?: string;
  inputType: 'text' | 'boolean' | 'number' | 'select' | 'color' | 'number-array' | 'card-3ds' | 'funding-sources';
  source: FieldSource;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  min?: number;
  warning?: string;
}

// ── Feature definition ────────────────────────────────────────────────────────

export interface PaymentFeatureDef {
  key: string;
  label: string;
  description: string;
  category: string;
  enabledBy: FeatureEnabledBy;
  /** Default value written when enabling an appconfig-exists feature, or default PM group cards for manifest-integration-pm-group features. */
  defaultAppConfig?: Record<string, any> | any[];
  /**
   * App config boolean key to mirror when this feature is toggled.
   * Used when an integration toggle also needs to flip a corresponding app config flag.
   */
  mirrorAppConfigBool?: string;
  fields: PaymentFeatureFieldDef[];
}

// ── Feature registry ──────────────────────────────────────────────────────────

export const PAYMENT_FEATURE_CATEGORIES = ['Payment Methods', 'Add-ons', 'Risk & Compliance', 'Analytics'] as const;

export const PAYMENT_FEATURES: PaymentFeatureDef[] = [
  // ── Payment Methods ─────────────────────────────────────────────────────────
  {
    key: 'credit_card',
    label: 'Credit Card',
    description: 'Cybersource credit and debit card processing.',
    category: 'Payment Methods',
    enabledBy: { type: 'manifest-integration', provider: 'Cybersource' },
    fields: [
      {
        key: 'ignoreAvs',
        label: 'Ignore AVS Check',
        description: 'Skip address verification on card transactions.',
        inputType: 'boolean',
        source: { type: 'manifest-integration-setting', provider: 'Cybersource', setting: 'ignoreAvs' },
        defaultValue: false,
      },
      {
        key: 'ignoreCvv',
        label: 'Ignore CVV Check',
        description: 'Skip CVV verification on card transactions.',
        inputType: 'boolean',
        source: { type: 'manifest-integration-setting', provider: 'Cybersource', setting: 'ignoreCvv' },
        defaultValue: false,
      },
      {
        key: 'card3ds',
        label: '3D Secure',
        description: 'Enable 3DS per card brand for stronger authentication.',
        inputType: 'card-3ds',
        source: { type: 'manifest-integration-setting', provider: 'Cybersource', setting: 'paymentMethods', groups: ['CCD'] },
      },
    ],
  },
  {
    key: 'apple_pay',
    label: 'Apple Pay',
    description: 'Apple Pay wallet payment via Cybersource.',
    category: 'Payment Methods',
    enabledBy: { type: 'manifest-integration-pm-group', provider: 'Cybersource', group: 'APL' },
    defaultAppConfig: [
      { cardBrand: 'VISA', cardBrandCode: 'VIS', enabled3ds: false, displayOrder: 5 },
      { cardBrand: 'MASTERCARD', cardBrandCode: 'MAS', enabled3ds: false, displayOrder: 6 },
    ],
    fields: [
      {
        key: 'apl3ds',
        label: '3D Secure',
        description: 'Enable 3DS per card network for Apple Pay.',
        inputType: 'card-3ds',
        source: { type: 'manifest-integration-setting', provider: 'Cybersource', setting: 'paymentMethods', groups: ['APL'] },
      },
    ],
  },
  {
    key: 'google_pay',
    label: 'Google Pay',
    description: 'Google Pay wallet payment via Cybersource.',
    category: 'Payment Methods',
    enabledBy: { type: 'manifest-integration-pm-group', provider: 'Cybersource', group: 'GGL' },
    defaultAppConfig: [
      { cardBrand: 'VISA', cardBrandCode: 'VIS', enabled3ds: false, displayOrder: 7 },
      { cardBrand: 'MASTERCARD', cardBrandCode: 'MAS', enabled3ds: false, displayOrder: 8 },
    ],
    fields: [
      {
        key: 'ggl3ds',
        label: '3D Secure',
        description: 'Enable 3DS per card network for Google Pay.',
        inputType: 'card-3ds',
        source: { type: 'manifest-integration-setting', provider: 'Cybersource', setting: 'paymentMethods', groups: ['GGL'] },
      },
    ],
  },
  {
    key: 'gift_card',
    label: 'Gift Card',
    description: 'Stored value / gift card payment support.',
    category: 'Payment Methods',
    enabledBy: { type: 'manifest-integration', provider: 'GiftCard' },
    fields: [
      {
        key: 'max_entries',
        label: 'Max Gift Cards Per Transaction',
        inputType: 'number',
        source: { type: 'appconfig-field', key: 'gift_card', field: 'max_entries' },
        defaultValue: 3,
        min: 1,
        warning: 'Siriusware merchants: do not exceed 3 — hard backend limit.',
      },
      {
        key: 'pin_required',
        label: 'PIN Always Required',
        description: 'Always prompt for a PIN when applying a gift card.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'gift_card', field: 'pin_required' },
        defaultValue: false,
      },
      {
        key: 'pin_default',
        label: 'PIN Field Default',
        description: "Controls the 'Does your card have a PIN?' pre-selection.",
        inputType: 'select',
        source: { type: 'appconfig-field', key: 'gift_card', field: 'pin_default' },
        options: [
          { value: 'yes', label: 'Visible by default' },
          { value: 'no', label: 'Hidden by default' },
        ],
      },
    ],
  },
  {
    key: 'paypal',
    label: 'PayPal',
    description: 'PayPal checkout including Pay Later and Venmo.',
    category: 'Payment Methods',
    enabledBy: { type: 'manifest-integration', provider: 'PayPal' },
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'paypal', field: 'clientId' },
      },
      {
        key: 'locale',
        label: 'Locale',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'paypal', field: 'locale' },
        defaultValue: 'en_US',
      },
      {
        key: 'fundingSources',
        label: 'Funding Sources',
        description: 'Payment methods shown in the PayPal button.',
        inputType: 'funding-sources',
        source: { type: 'appconfig-field', key: 'paypal', field: 'fundingSources' },
      },
    ],
  },
  {
    key: 'pay_later',
    label: 'Pay Later (Uplift)',
    description: 'Buy now, pay later installment financing.',
    category: 'Payment Methods',
    enabledBy: { type: 'appconfig-exists', key: 'uplift' },
    defaultAppConfig: { apiKey: '', upliftId: '' },
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'uplift', field: 'apiKey' },
      },
      {
        key: 'upliftId',
        label: 'Uplift ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'uplift', field: 'upliftId' },
      },
    ],
  },
  {
    key: 'amazon_pay',
    label: 'Amazon Pay',
    description: 'Amazon Pay one-click checkout.',
    category: 'Payment Methods',
    enabledBy: { type: 'appconfig-exists', key: 'amazon_pay' },
    defaultAppConfig: { clientKey: '', merchantId: '', region: 'us', locale: 'en_US', buttonColor: '#FF9900' },
    fields: [
      {
        key: 'clientKey',
        label: 'Client Key',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'amazon_pay', field: 'clientKey' },
      },
      {
        key: 'merchantId',
        label: 'Merchant ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'amazon_pay', field: 'merchantId' },
      },
      {
        key: 'region',
        label: 'Region',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'amazon_pay', field: 'region' },
      },
      {
        key: 'locale',
        label: 'Locale',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'amazon_pay', field: 'locale' },
        defaultValue: 'en_US',
      },
      {
        key: 'buttonColor',
        label: 'Button Color',
        inputType: 'color',
        source: { type: 'appconfig-field', key: 'amazon_pay', field: 'buttonColor' },
      },
    ],
  },
  {
    key: 'trustly',
    label: 'Trustly',
    description: 'Open banking bank transfer payments.',
    category: 'Payment Methods',
    enabledBy: { type: 'appconfig-exists', key: 'trustly' },
    defaultAppConfig: { accessId: '' },
    fields: [
      {
        key: 'accessId',
        label: 'Access ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'trustly', field: 'accessId' },
      },
    ],
  },

  // ── Add-ons ─────────────────────────────────────────────────────────────────
  {
    key: 'insurance',
    label: 'Insurance Protection',
    description: 'TicketGuardian event insurance offered at checkout.',
    category: 'Add-ons',
    enabledBy: { type: 'manifest-integration', provider: 'TicketGuardian' },
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'ticketGuardian', field: 'apiKey' },
      },
      {
        key: 'currency',
        label: 'Currency',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'ticketGuardian', field: 'currency' },
        defaultValue: 'USD',
      },
      {
        key: 'locale',
        label: 'Locale',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'ticketGuardian', field: 'locale' },
        defaultValue: 'en-US',
      },
      {
        key: 'splitInsurance',
        label: 'Split Insurance Charge',
        description: 'Split the insurance fee as a separate line item.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'ticketGuardian', field: 'splitInsurance' },
        defaultValue: false,
      },
    ],
  },
  {
    key: 'donation',
    label: 'Donation',
    description: 'Optional donation step offered during checkout.',
    category: 'Add-ons',
    enabledBy: { type: 'manifest-integration', provider: 'CustomDonationProvider' },
    fields: [
      {
        key: 'amounts',
        label: 'Preset Amounts',
        description: 'Fixed dollar amounts shown as quick-select options.',
        inputType: 'number-array',
        source: { type: 'appconfig-field', key: 'donation', field: 'amounts' },
      },
      {
        key: 'enableRounding',
        label: 'Enable Round-up',
        description: 'Offer to round up the total as a donation.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'donation', field: 'enableRounding' },
        defaultValue: false,
      },
      {
        key: 'enableCustomAmount',
        label: 'Allow Custom Amount',
        description: 'Let guests enter their own donation amount.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'donation', field: 'enableCustomAmount' },
        defaultValue: false,
      },
      {
        key: 'splitDonation',
        label: 'Split Donation',
        description: 'Charge the donation as a separate transaction.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'donation', field: 'splitDonation' },
        defaultValue: false,
      },
      {
        key: 'autoSelectRoundUp',
        label: 'Auto-select Round-up',
        description: 'Pre-select the round-up option for guests.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'donation', field: 'autoSelectRoundUp' },
        defaultValue: false,
      },
      {
        key: 'displayTotals',
        label: 'Display Totals',
        description: 'Show a running total including the donation amount.',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'donation', field: 'displayTotals' },
        defaultValue: false,
      },
      {
        key: 'maxDonationAmount',
        label: 'Max Donation ($)',
        inputType: 'number',
        source: { type: 'appconfig-field', key: 'donation', field: 'maxDonationAmount' },
        min: 0,
      },
      {
        key: 'bannerImage',
        label: 'Banner Image URL',
        description: 'Image displayed at the top of the donation screen.',
        inputType: 'text',
        source: { type: 'appconfig-scalar', key: 'donation_banner_image' },
      },
    ],
  },
  {
    key: 'vouchers',
    label: 'Vouchers',
    description: 'Promotional voucher / promo code redemption.',
    category: 'Add-ons',
    enabledBy: { type: 'appconfig-exists', key: 'voucher' },
    defaultAppConfig: { maxEntries: 3 },
    fields: [
      {
        key: 'maxEntries',
        label: 'Max Vouchers Per Transaction',
        inputType: 'number',
        source: { type: 'appconfig-field', key: 'voucher', field: 'maxEntries' },
        defaultValue: 3,
        min: 1,
      },
    ],
  },

  // ── Risk & Compliance ────────────────────────────────────────────────────────
  {
    key: 'accertify',
    label: 'Accertify (Risk Management)',
    description: 'Real-time fraud detection and transaction scoring.',
    category: 'Risk & Compliance',
    enabledBy: { type: 'manifest-integration', provider: 'Accertify' },
    mirrorAppConfigBool: 'enable_risk_management',
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'risk_management', field: 'clientId' },
      },
    ],
  },
  {
    key: 'recaptcha',
    label: 'reCAPTCHA v3',
    description: 'Google bot protection on payment submission.',
    category: 'Risk & Compliance',
    enabledBy: { type: 'appconfig-bool', key: 'recaptchav3', field: 'enabled' },
    defaultAppConfig: { enabled: true, key: '', enterprise: false },
    fields: [
      {
        key: 'key',
        label: 'Site Key',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'recaptchav3', field: 'key' },
      },
      {
        key: 'enterprise',
        label: 'Enterprise Mode',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'recaptchav3', field: 'enterprise' },
        defaultValue: false,
      },
    ],
  },

  // ── Analytics ────────────────────────────────────────────────────────────────
  {
    key: 'rokt',
    label: 'Rokt',
    description: 'Post-transaction engagement and upsell widget.',
    category: 'Analytics',
    enabledBy: { type: 'appconfig-bool', key: 'rokt', field: 'enable' },
    defaultAppConfig: { enable: true, accountId: '' },
    fields: [
      {
        key: 'accountId',
        label: 'Account ID',
        inputType: 'text',
        source: { type: 'appconfig-field', key: 'rokt', field: 'accountId' },
      },
    ],
  },
  {
    key: 'hotjar',
    label: 'Hotjar',
    description: 'Session recording and heatmap analytics.',
    category: 'Analytics',
    enabledBy: { type: 'appconfig-bool', key: 'hotjar', field: 'enabled' },
    defaultAppConfig: { enabled: true, debug_mode: false },
    fields: [
      {
        key: 'debug_mode',
        label: 'Debug Mode',
        inputType: 'boolean',
        source: { type: 'appconfig-field', key: 'hotjar', field: 'debug_mode' },
        defaultValue: false,
      },
    ],
  },
];

// ── Runtime helpers ───────────────────────────────────────────────────────────

export function isFeatureEnabled(config: MerchantConfig, def: PaymentFeatureDef): boolean {
  const eb = def.enabledBy;
  if (eb.type === 'manifest-integration') {
    return config.integrations.find((i) => i.provider === eb.provider)?.enabled ?? false;
  }
  if (eb.type === 'manifest-integration-pm-group') {
    const pm = config.integrations.find((i) => i.provider === eb.provider)?.settings?.paymentMethods;
    return Array.isArray(pm?.[eb.group]) && pm[eb.group].length > 0;
  }
  if (eb.type === 'appconfig-exists') {
    return config.applicationConfigs.some((r) => r.name === eb.key);
  }
  // appconfig-bool
  const row = config.applicationConfigs.find((r) => r.name === eb.key);
  if (!row) return false;
  return eb.field ? !!row.value?.[eb.field] : !!row.value;
}

export function getFieldValue(config: MerchantConfig, source: FieldSource): any {
  if (source.type === 'appconfig-field') {
    return config.applicationConfigs.find((r) => r.name === source.key)?.value?.[source.field];
  }
  if (source.type === 'appconfig-scalar') {
    return config.applicationConfigs.find((r) => r.name === source.key)?.value;
  }
  if (source.type === 'manifest-integration-setting') {
    return config.integrations.find((i) => i.provider === source.provider)?.settings?.[source.setting];
  }
  // manifest-integration-credential
  return config.integrations.find((i) => i.provider === source.provider)?.credentials?.[source.credential];
}

export function setFieldValue(cfg: MerchantConfig, source: FieldSource, value: any): void {
  if (source.type === 'appconfig-field') {
    const idx = cfg.applicationConfigs.findIndex((r) => r.name === source.key);
    if (idx >= 0) {
      cfg.applicationConfigs[idx] = { name: source.key, value: { ...cfg.applicationConfigs[idx].value, [source.field]: value } };
    } else {
      cfg.applicationConfigs.push({ name: source.key, value: { [source.field]: value } });
    }
    return;
  }
  if (source.type === 'appconfig-scalar') {
    const idx = cfg.applicationConfigs.findIndex((r) => r.name === source.key);
    if (idx >= 0) cfg.applicationConfigs[idx] = { name: source.key, value };
    else cfg.applicationConfigs.push({ name: source.key, value });
    return;
  }
  if (source.type === 'manifest-integration-setting') {
    const intg = cfg.integrations.find((i) => i.provider === source.provider);
    if (intg) intg.settings[source.setting] = value;
    return;
  }
  // manifest-integration-credential
  const intg = cfg.integrations.find((i) => i.provider === source.provider);
  if (intg) intg.credentials[source.credential] = value;
}

export function toggleFeature(cfg: MerchantConfig, def: PaymentFeatureDef, enable: boolean): void {
  const eb = def.enabledBy;
  if (eb.type === 'manifest-integration-pm-group') {
    const intg = cfg.integrations.find((i) => i.provider === eb.provider);
    if (!intg) return;
    if (!intg.settings.paymentMethods) intg.settings.paymentMethods = {};
    if (enable) {
      if (!intg.settings.paymentMethods[eb.group]?.length) {
        intg.settings.paymentMethods[eb.group] = Array.isArray(def.defaultAppConfig) ? def.defaultAppConfig : [];
      }
    } else {
      delete intg.settings.paymentMethods[eb.group];
    }
    return;
  }
  if (eb.type === 'manifest-integration') {
    const intg = cfg.integrations.find((i) => i.provider === eb.provider);
    if (intg) intg.enabled = enable;
    if (def.mirrorAppConfigBool) {
      const key = def.mirrorAppConfigBool;
      const idx = cfg.applicationConfigs.findIndex((r) => r.name === key);
      if (idx >= 0) cfg.applicationConfigs[idx] = { name: key, value: enable };
      else if (enable) cfg.applicationConfigs.push({ name: key, value: true });
    }
    return;
  }
  if (eb.type === 'appconfig-exists') {
    if (enable) {
      if (!cfg.applicationConfigs.find((r) => r.name === eb.key)) {
        cfg.applicationConfigs.push({ name: eb.key, value: def.defaultAppConfig ?? {} });
      }
    } else {
      cfg.applicationConfigs = cfg.applicationConfigs.filter((r) => r.name !== eb.key);
    }
    return;
  }
  // appconfig-bool
  const key = eb.key;
  const field = eb.field;
  const idx = cfg.applicationConfigs.findIndex((r) => r.name === key);
  if (field) {
    if (idx >= 0) {
      cfg.applicationConfigs[idx] = { name: key, value: { ...cfg.applicationConfigs[idx].value, [field]: enable } };
    } else if (enable) {
      cfg.applicationConfigs.push({ name: key, value: { ...(def.defaultAppConfig ?? {}), [field]: true } });
    }
  } else {
    if (idx >= 0) cfg.applicationConfigs[idx] = { name: key, value: enable };
    else if (enable) cfg.applicationConfigs.push({ name: key, value: true });
  }
}
