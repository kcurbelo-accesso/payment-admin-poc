export interface Stack {
  id: string;
  name: string;
  type: 'dedicated' | 'shared';
  region: string;
  description: string;
}

export interface Tenant {
  id: string;
  stackId: string;
  name: string;
  slug: string;
  region: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'inactive';
  merchantCount: number;
}

export interface Merchant {
  id: string;
  tenantId: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  lastUpdated: string;
  config: MerchantConfig;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  applyLayoutColor: string;
}

export interface ComponentFeatures {
  [key: string]: any;
}

export interface ComponentConfig {
  id: string;
  componentType: string;
  order: number;
  enabled: boolean;
  features: ComponentFeatures;
  localeRefs: { namespace: string; keys: string[] };
  styleOverrides?: { [key: string]: string };
}

export interface PageConfig {
  id: string;
  route: string;
  order: number;
  title: string;
  enabled: boolean;
  icon: string;
  components: ComponentConfig[];
}

export interface IntegrationConfig {
  id: string;
  type: string;
  provider: string;
  enabled: boolean;
  initStrategy: { timing: string; blocksRendering: boolean; requiredForPages: string[] };
  credentials: { [key: string]: string };
  settings: { [key: string]: any };
}

export interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

export interface MerchantConfig {
  version: string;
  merchant: { id: string; tenantId: string; name: string; theme: ThemeConfig };
  applicationConfigs: { name: string; value: any }[];
  navigation: {
    pages: PageConfig[];
    currentPageIndex: number;
    allowSkip: boolean;
    showProgress: boolean;
  };
  integrations: IntegrationConfig[];
  featureFlags: FeatureFlag[];
  locales: { locale: string; namespaces: any[] };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  merchantId: string;
  tenantId: string;
  message: string;
  metadata?: { [key: string]: any };
}

export interface AnalyticsMetric {
  merchantId: string;
  date: string;
  sessions: number;
  transactions: number;
  successCount: number;
  failureCount: number;
  revenue: number;
  byPaymentMethod: Record<string, number>; // method key → successful transaction count
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildIntegrations(
  merchantId: string,
  opts: {
    cybersourceEnabled: boolean;
    storedValueEnabled: boolean;
    paypalEnabled: boolean;
    accertifyEnabled: boolean;
    riskEnabled: boolean;
    ticketGuardianEnabled: boolean;
    donationEnabled: boolean;
  }
): IntegrationConfig[] {
  return [
    {
      id: `int_cybersource_${merchantId}`,
      type: 'payment',
      provider: 'Cybersource',
      enabled: opts.cybersourceEnabled,
      initStrategy: { timing: 'critical', blocksRendering: true, requiredForPages: ['checkout'] },
      credentials: { merchantId: merchantId },
      settings: {
        paymentMethods: {
          CCD: [
            { cardBrand: 'VISA', cardBrandCode: 'VIS', enabled3ds: true, displayOrder: 1 },
            { cardBrand: 'MASTERCARD', cardBrandCode: 'MAS', enabled3ds: false, displayOrder: 2 },
            { cardBrand: 'AMERICAN EXPRESS', cardBrandCode: 'AME', enabled3ds: false, displayOrder: 3 },
            { cardBrand: 'DISCOVER', cardBrandCode: 'DIS', enabled3ds: false, displayOrder: 4 },
          ],
          APL: [
            { cardBrand: 'VISA', cardBrandCode: 'VIS', enabled3ds: false, displayOrder: 5 },
            { cardBrand: 'MASTERCARD', cardBrandCode: 'MAS', enabled3ds: false, displayOrder: 6 },
          ],
          GGL: [
            { cardBrand: 'VISA', cardBrandCode: 'VIS', enabled3ds: false, displayOrder: 7 },
            { cardBrand: 'MASTERCARD', cardBrandCode: 'MAS', enabled3ds: false, displayOrder: 8 },
          ],
        },
        ignoreAvs: false,
        ignoreCvv: false,
      },
    },
    {
      id: `int_storedvalue_${merchantId}`,
      type: 'payment',
      provider: 'GiftCard',
      enabled: opts.storedValueEnabled,
      initStrategy: { timing: 'critical', blocksRendering: true, requiredForPages: ['payment'] },
      credentials: { merchantId: merchantId },
      settings: {
        paymentMethods: {
          SVC: [{ cardBrand: 'STORED VALUE CARD', cardBrandCode: 'SVC', enabled3ds: false, displayOrder: 24 }],
        },
        ignoreAvs: false,
        ignoreCvv: false,
      },
    },
    {
      id: `int_paypal_${merchantId}`,
      type: 'payment',
      provider: 'PayPal',
      enabled: opts.paypalEnabled,
      initStrategy: { timing: 'critical', blocksRendering: true, requiredForPages: ['checkout'] },
      credentials: { clientId: `pp_client_${merchantId}` },
      settings: {
        fundingSources: [
          { source: 'paypal', enabled: true, style: { color: 'gold', label: 'checkout' } },
          { source: 'paylater', enabled: true },
          { source: 'venmo', enabled: false },
        ],
      },
    },
    {
      id: `int_accertify_${merchantId}`,
      type: 'fraud-detection',
      provider: 'Accertify',
      enabled: opts.accertifyEnabled,
      initStrategy: { timing: 'prefetch', blocksRendering: false, requiredForPages: ['checkout'] },
      credentials: { clientId: `acrt_${merchantId}` },
      settings: {},
    },
    {
      id: `int_risk_${merchantId}`,
      type: 'fraud-detection',
      provider: 'RiskManagement',
      enabled: opts.riskEnabled,
      initStrategy: { timing: 'lazy', blocksRendering: false, requiredForPages: [] },
      credentials: { clientId: `risk_${merchantId}` },
      settings: {},
    },
    {
      id: `int_ticketguardian_${merchantId}`,
      type: 'insurance',
      provider: 'TicketGuardian',
      enabled: opts.ticketGuardianEnabled,
      initStrategy: { timing: 'prefetch', blocksRendering: false, requiredForPages: ['insurance'] },
      credentials: { apiKey: `tg_${merchantId}_key` },
      settings: { splitInsurance: false },
    },
    {
      id: `int_donation_${merchantId}`,
      type: 'donation',
      provider: 'CustomDonationProvider',
      enabled: opts.donationEnabled,
      initStrategy: { timing: 'lazy', blocksRendering: false, requiredForPages: ['donation'] },
      credentials: {},
      settings: { amounts: [1, 2, 5], roundingMultiple: 0, enableRounding: false, enableCustomAmount: true, splitDonation: false },
    },
  ];
}

function buildFeatureFlags(opts: { skipPayment: boolean; enable3ds: boolean; guestCheckout: boolean }): FeatureFlag[] {
  return [
    { key: 'skip_payment_selection', label: 'Skip Payment Selection', enabled: opts.skipPayment, description: 'Bypass payment method selection step' },
    { key: 'enable_3ds', label: 'Enable 3DS Authentication', enabled: opts.enable3ds, description: 'Enable 3D Secure for card payments' },
    { key: 'show_order_summary', label: 'Show Order Summary', enabled: true, description: 'Display order summary panel' },
    { key: 'enable_guest_checkout', label: 'Enable Guest Checkout', enabled: opts.guestCheckout, description: 'Allow checkout without account' },
    { key: 'dark_mode_support', label: 'Dark Mode Support', enabled: false, description: 'Enable dark mode theming' },
  ];
}

function buildPages(
  merchantId: string,
  opts: {
    insuranceEnabled: boolean;
    payMonthlyEnabled: boolean;
    paymentEnabled: boolean;
  }
): PageConfig[] {
  return [
    {
      id: 'insurance',
      route: '/insurance',
      order: 1,
      title: 'Insurance',
      enabled: opts.insuranceEnabled,
      icon: 'shield-check',
      components: [
        {
          id: `comp_donation_${merchantId}`,
          componentType: 'donation',
          order: 1,
          enabled: true,
          features: { amounts: [1, 2, 5], roundingMultiple: 0, enableRounding: false, enableCustomAmount: true, splitDonation: false },
          localeRefs: { namespace: 'donation', keys: ['title', 'amount', 'custom'] },
          styleOverrides: { borderRadius: '4px' },
        },
        {
          id: `comp_insurance_${merchantId}`,
          componentType: 'insurance',
          order: 2,
          enabled: opts.insuranceEnabled,
          features: { apiKey: `pk_sandbox_${merchantId}`, splitInsurance: false },
          localeRefs: { namespace: 'insurance', keys: ['title'] },
          styleOverrides: { borderRadius: '4px' },
        },
      ],
    },
    {
      id: 'pay-monthly',
      route: '/pay-monthly',
      order: 2,
      title: 'Pay Monthly',
      enabled: opts.payMonthlyEnabled,
      icon: 'calendar',
      components: [
        {
          id: `comp_flexpay_${merchantId}`,
          componentType: 'pay-later',
          order: 1,
          enabled: opts.payMonthlyEnabled,
          features: { apiKey: `pk_sandbox_flexpay_${merchantId}` },
          localeRefs: { namespace: 'flexpay', keys: ['title', 'button', 'custom'] },
        },
      ],
    },
    {
      id: 'payment',
      route: '/payment',
      order: 3,
      title: 'Payment',
      enabled: opts.paymentEnabled,
      icon: 'credit-card',
      components: [
        {
          id: `comp_payment_${merchantId}`,
          componentType: 'payment-method-selector',
          order: 1,
          enabled: opts.paymentEnabled,
          features: { hideHeader: true, skipPaymentSelection: false, fullDemographicMethods: null },
          localeRefs: { namespace: 'billing', keys: ['giftcard', 'applepay', 'voucher'] },
          styleOverrides: { borderRadius: '4px' },
        },
      ],
    },
  ];
}

/** Returns a fresh default PageConfig for the given page id, used when re-enabling a removed page. */
export function makeDefaultPage(pageId: string, merchantId: string): PageConfig {
  return buildPages(merchantId, { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true })
    .find((p) => p.id === pageId)!;
}

// ─── Stacks ──────────────────────────────────────────────────────────────────

export const MOCK_STACKS: Stack[] = [
  {
    id: 'stack_na1',
    name: 'NA1',
    type: 'shared',
    region: 'North America',
    description: 'Shared multi-tenant stack for North American operators',
  },
  {
    id: 'stack_cf',
    name: 'CF',
    type: 'dedicated',
    region: 'North America',
    description: 'Dedicated stack — Cedar Fair',
  },
  {
    id: 'stack_sf',
    name: 'SF',
    type: 'dedicated',
    region: 'North America',
    description: 'Dedicated stack — Six Flags',
  },
  {
    id: 'stack_meg_na',
    name: 'MEG-NA',
    type: 'dedicated',
    region: 'North America',
    description: 'Dedicated stack — Merlin Entertainments NA',
  },
];

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const MOCK_TENANTS: Tenant[] = [
  // ── NA1 shared stack (several small-to-mid tenants) ──
  {
    id: 'tenant_lgds',
    stackId: 'stack_na1',
    name: 'Legends',
    slug: 'legends-na',
    region: 'North America',
    plan: 'enterprise',
    status: 'active',
    merchantCount: 3,
  },
  {
    id: 'tenant_owa',
    stackId: 'stack_na1',
    name: 'OWA Parks & Resorts',
    slug: 'owa',
    region: 'North America',
    plan: 'pro',
    status: 'active',
    merchantCount: 1,
  },
  {
    id: 'tenant_pe',
    stackId: 'stack_na1',
    name: 'Palace Entertainment',
    slug: 'pe',
    region: 'North America',
    plan: 'pro',
    status: 'active',
    merchantCount: 5,
  },
  // ── Dedicated stacks (one tenant per stack) ──
  {
    id: 'tenant_cedarfair',
    stackId: 'stack_cf',
    name: 'Cedar Fair',
    slug: 'cedarfair',
    region: 'North America',
    plan: 'enterprise',
    status: 'active',
    merchantCount: 5,
  },
  {
    id: 'tenant_sixflags',
    stackId: 'stack_sf',
    name: 'Six Flags',
    slug: 'sixflags',
    region: 'North America',
    plan: 'enterprise',
    status: 'active',
    merchantCount: 4,
  },
  {
    id: 'tenant_merlin_na',
    stackId: 'stack_meg_na',
    name: 'Merlin Entertainments NA',
    slug: 'merlin-na',
    region: 'North America',
    plan: 'pro',
    status: 'active',
    merchantCount: 3,
  },
];

// ─── Merchants ───────────────────────────────────────────────────────────────

function makeMerchant(
  id: string,
  tenantId: string,
  name: string,
  status: 'active' | 'inactive' | 'pending',
  lastUpdated: string,
  theme: ThemeConfig,
  pageOpts: { insuranceEnabled: boolean; payMonthlyEnabled: boolean; paymentEnabled: boolean },
  integrationOpts: Parameters<typeof buildIntegrations>[1],
  flagOpts: Parameters<typeof buildFeatureFlags>[0],
  appConfigs: { name: string; value: any }[] = [],
  version: string = '1.0.0'
): Merchant {
  return {
    id,
    tenantId,
    name,
    status,
    lastUpdated,
    config: {
      version,
      merchant: { id, tenantId, name, theme },
      applicationConfigs: appConfigs,
      navigation: {
        pages: buildPages(id, pageOpts).filter((p) => p.enabled),
        currentPageIndex: 0,
        allowSkip: false,
        showProgress: true,
      },
      integrations: buildIntegrations(id, integrationOpts),
      featureFlags: buildFeatureFlags(flagOpts),
      locales: { locale: 'en-US', namespaces: [] },
    },
  };
}

export const MOCK_MERCHANTS: Merchant[] = [
  // ── NA1 / Palace Entertainment ──
  makeMerchant(
    'na1_001',
    'tenant_pe',
    'Big Kahuna Water Park',
    'active',
    '2026-03-20T14:32:00Z',
    { primaryColor: '#E8291C', secondaryColor: '#F7941D', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: true,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [
      { name: 'paypal', value: { clientId: 'sb', locale: 'en_US', fundingSources: [{ source: 'paypal', style: { color: 'gold', label: 'checkout' } }, { source: 'paylater' }, { source: 'venmo' }] } },
      { name: 'uplift', value: { apiKey: 'uxwMbG4vWl14rv9fcMA3xaqNTj6p0EsV9ED0exKY', upliftId: 'UP-84811561-99' } },
      { name: 'ticketGuardian', value: { apiKey: 'pk_sandbox_effda466135bc6d701fe0f14cc8282a5deecea11', splitInsurance: false } },
      { name: 'risk_management', value: { clientId: 'pUGPWTxRgXvxF8-Z4PggJZ6XSq8' } },
      { name: 'enable_risk_management', value: true },
      { name: 'donation', value: { amounts: [1, 2.5, 5, 10], enableRounding: true, enableCustomAmount: true, splitDonation: true, roundingMultiple: 1, maxDonationAmount: 20, prioritize: false, fullPageDisplay: false, autoSelectRoundUp: false, displayTotals: true } },
      { name: 'donation_banner_image', value: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsk4-_08hxiUKlHR87XdGC7tFKdUED9sgPuw&s' },
      { name: 'gift_card', value: { max_entries: 3, pin_required: false, pin_default: 'no' } },
      { name: 'require_stored_cvv', value: true },
      { name: 'use_payment_auth', value: true },
      { name: 'enable_dynamic_3ds', value: true },
      { name: 'cart_summary', value: { hide: false } },
      { name: 'default_country_code', value: 'US' },
      { name: 'disable_proxy', value: { flexpay: false } },
    ],
    '1.3.0'
  ),
  makeMerchant(
    'na1_002',
    'tenant_pe',
    "Noah's Ark Water Park",
    'active',
    '2026-03-19T09:15:00Z',
    { primaryColor: '#006D38', secondaryColor: '#FFB81C', fontFamily: 'Inter', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.2.0'
  ),
  makeMerchant(
    'na1_003',
    'tenant_pe',
    'Sandcastle Waterpark',
    'active',
    '2026-03-17T11:20:00Z',
    { primaryColor: '#003399', secondaryColor: '#FF6B00', fontFamily: 'system-ui', borderRadius: '4px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.1.0'
  ),

  // ── NA1 / OWA ──
  makeMerchant(
    'na1_004',
    'tenant_owa',
    'OWA Parks & Resorts',
    'active',
    '2026-03-18T16:45:00Z',
    { primaryColor: '#B5451B', secondaryColor: '#F2A65A', fontFamily: 'Open Sans', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: false,
      ticketGuardianEnabled: true,
      donationEnabled: true,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.2.0'
  ),
  makeMerchant(
    'na1_005',
    'tenant_lgds',
    'One World Observatory',
    'active',
    '2026-03-16T14:00:00Z',
    { primaryColor: '#1A1A2E', secondaryColor: '#E94560', fontFamily: 'Roboto', borderRadius: '12px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: false,
      accertifyEnabled: false,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: true, enable3ds: false, guestCheckout: true }
  ),

  // ── Cedar Fair (stack_cf) ──
  makeMerchant(
    'cf_001',
    'tenant_cedarfair',
    'Cedar Point',
    'active',
    '2026-03-21T08:00:00Z',
    { primaryColor: '#003DA5', secondaryColor: '#E31837', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: true,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [
      { name: 'paypal', value: { clientId: 'AaiBnKZyM1UllBN9nUdk5iaSVs_h1UbF2YUeRpvF67-8ge-8JrGWE-T6QTF3OEfTfR0CwvlbGhNNrbxo', locale: 'en_US', fundingSources: [{ source: 'paypal', style: { color: 'gold', label: 'checkout' } }, { source: 'paylater' }, { source: 'venmo' }] } },
      { name: 'trustly', value: { accessId: 'cvWEldTEhZUY2qVsDPdD' } },
      { name: 'uplift', value: { apiKey: 'pk_live_uplift_cf001', upliftId: 'UP-12345678-01' } },
      { name: 'ticketGuardian', value: { apiKey: 'pk_live_tg_cf001', currency: 'USD', locale: 'en-US', splitInsurance: true } },
      { name: 'recaptchav3', value: { enabled: true, key: '6LeT5xxxxxxxxxxxxxxxxxxx', enterprise: false } },
      { name: 'rokt', value: { accountId: 'rokt_cedar_point_001', enable: true, identifier: { paymentMethodPage: 'pm_page', creditCardPage: 'cc_page' } } },
      { name: 'risk_management', value: { clientId: 'risk_cf001_prod' } },
      { name: 'enable_risk_management', value: true },
      { name: 'donation', value: { amounts: [1, 5, 10, 25], enableRounding: false, enableCustomAmount: true, splitDonation: false, roundingMultiple: 0, maxDonationAmount: 50, prioritize: true, fullPageDisplay: false, autoSelectRoundUp: false, displayTotals: true } },
      { name: 'gift_card', value: { max_entries: 3, pin_required: true, pin_default: 'yes' } },
      { name: 'voucher', value: { maxEntries: 5 } },
      { name: 'cybersource_session_timeout', value: 900000 },
      { name: 'default_country_code', value: 'US' },
      { name: 'preferredCountryCodes', value: 'US,CA' },
      { name: 'applyAppLayoutColor', value: false },
      { name: 'disable_proxy', value: { flexpay: false } },
    ],
    '1.3.0'
  ),
  makeMerchant(
    'cf_002',
    'tenant_cedarfair',
    'Kings Island',
    'active',
    '2026-03-20T17:30:00Z',
    { primaryColor: '#002EAA', secondaryColor: '#CC492A', fontFamily: 'Inter', borderRadius: '12px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: false },
    [],
    '1.2.0'
  ),
  makeMerchant(
    'cf_003',
    'tenant_cedarfair',
    'Carowinds',
    'active',
    '2026-03-19T12:45:00Z',
    { primaryColor: '#BD3039', secondaryColor: '#0C2340', fontFamily: 'Roboto', borderRadius: '4px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: false,
      accertifyEnabled: false,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: true,
    },
    { skipPayment: true, enable3ds: false, guestCheckout: true },
    [],
    '1.1.0'
  ),
  makeMerchant(
    'cf_004',
    'tenant_cedarfair',
    "Knott's Berry Farm",
    'active',
    '2026-03-18T10:00:00Z',
    { primaryColor: '#5C2D91', secondaryColor: '#FFD700', fontFamily: 'system-ui', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: false,
      ticketGuardianEnabled: true,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: false }
  ),
  makeMerchant(
    'cf_005',
    'tenant_cedarfair',
    'Worlds of Fun',
    'active',
    '2026-03-17T09:30:00Z',
    { primaryColor: '#00843D', secondaryColor: '#FFC72C', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: false,
      accertifyEnabled: false,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: false, guestCheckout: true }
  ),

  // ── Six Flags (stack_sf) ──
  makeMerchant(
    'sf_001',
    'tenant_sixflags',
    'Six Flags Magic Mountain',
    'active',
    '2026-03-22T09:00:00Z',
    { primaryColor: '#046BD2', secondaryColor: '#FEE922', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: true,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [
      { name: 'paypal', value: { clientId: 'sf_pp_live_client_id', locale: 'en_US', fundingSources: [{ source: 'paypal', style: { color: 'blue', label: 'pay' } }, { source: 'venmo' }] } },
      { name: 'uplift', value: { apiKey: 'pk_live_uplift_sf001', upliftId: 'UP-99887766-01' } },
      { name: 'ticketGuardian', value: { apiKey: 'pk_live_tg_sf001', currency: 'USD', locale: 'en-US', splitInsurance: false } },
      { name: 'risk_management', value: { clientId: 'risk_sf001_prod' } },
      { name: 'enable_risk_management', value: true },
      { name: 'donation', value: { amounts: [2, 5, 10], enableRounding: true, enableCustomAmount: false, splitDonation: false, roundingMultiple: 1, maxDonationAmount: 25, prioritize: false, fullPageDisplay: false, autoSelectRoundUp: true, displayTotals: false } },
      { name: 'gift_card', value: { max_entries: 2, pin_required: false, pin_default: 'no' } },
      { name: 'require_stored_cvv', value: false },
      { name: 'use_payment_auth', value: true },
      { name: 'enable_dynamic_3ds', value: true },
      { name: 'default_country_code', value: 'US' },
      { name: 'preferredCountryCodes', value: 'US' },
      { name: 'enhanced_phone_number', value: { use_enhanced_phone_number: true, display_with_flags: true } },
      { name: 'cart_summary', value: { hide: false } },
    ],
    '1.3.0'
  ),
  makeMerchant(
    'sf_002',
    'tenant_sixflags',
    'Six Flags Over Georgia',
    'active',
    '2026-03-21T14:20:00Z',
    { primaryColor: '#1e40af', secondaryColor: '#93c5fd', fontFamily: 'Inter', borderRadius: '12px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.2.0'
  ),
  makeMerchant(
    'sf_003',
    'tenant_sixflags',
    'Six Flags Over Texas',
    'active',
    '2026-03-20T11:10:00Z',
    { primaryColor: '#7c3aed', secondaryColor: '#c4b5fd', fontFamily: 'Open Sans', borderRadius: '16px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: false,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: true, enable3ds: true, guestCheckout: false },
    [],
    '1.1.0'
  ),
  makeMerchant(
    'sf_004',
    'tenant_sixflags',
    'Six Flags Fiesta Texas',
    'pending',
    '2026-03-15T08:30:00Z',
    { primaryColor: '#dc2626', secondaryColor: '#fca5a5', fontFamily: 'system-ui', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: false,
      accertifyEnabled: false,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: false, guestCheckout: true }
  ),

  // ── Merlin Entertainments NA (stack_meg_na) ──
  makeMerchant(
    'meg_001',
    'tenant_merlin_na',
    'Legoland California',
    'active',
    '2026-03-21T10:00:00Z',
    { primaryColor: '#E3000B', secondaryColor: '#FFD700', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: true, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: true,
      ticketGuardianEnabled: true,
      donationEnabled: true,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.3.0'
  ),
  makeMerchant(
    'meg_002',
    'tenant_merlin_na',
    'Legoland Florida',
    'active',
    '2026-03-20T13:00:00Z',
    { primaryColor: '#006DB7', secondaryColor: '#FFD700', fontFamily: 'Roboto', borderRadius: '8px', applyLayoutColor: 'false' },
    { insuranceEnabled: true, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: true,
      paypalEnabled: true,
      accertifyEnabled: true,
      riskEnabled: false,
      ticketGuardianEnabled: true,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: true, guestCheckout: true },
    [],
    '1.2.0'
  ),
  makeMerchant(
    'meg_003',
    'tenant_merlin_na',
    'Madame Tussauds NYC',
    'active',
    '2026-03-19T11:30:00Z',
    { primaryColor: '#8B0000', secondaryColor: '#C0C0C0', fontFamily: 'Inter', borderRadius: '4px', applyLayoutColor: 'false' },
    { insuranceEnabled: false, payMonthlyEnabled: false, paymentEnabled: true },
    {
      cybersourceEnabled: true,
      storedValueEnabled: false,
      paypalEnabled: true,
      accertifyEnabled: false,
      riskEnabled: true,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    },
    { skipPayment: false, enable3ds: false, guestCheckout: true }
  ),
];

// ─── Logs ────────────────────────────────────────────────────────────────────

const LOG_MESSAGES: { level: LogEntry['level']; service: string; message: string; metadata?: any }[] = [
  { level: 'INFO', service: 'payment-service', message: 'Payment authorization successful', metadata: { amount: 125.0, currency: 'USD', method: 'CCD' } },
  { level: 'INFO', service: 'config-service', message: 'Config loaded for merchant', metadata: { version: '1.0.0', cacheHit: true } },
  { level: 'INFO', service: 'auth-service', message: 'Session initialized', metadata: { sessionId: 'sess_abc123', ttl: 3600 } },
  { level: 'INFO', service: 'checkout-service', message: 'Order summary computed', metadata: { itemCount: 3, subtotal: 299.0 } },
  { level: 'INFO', service: 'payment-service', message: 'Tokenization successful', metadata: { tokenId: 'tok_xyz789', provider: 'Cybersource' } },
  { level: 'INFO', service: 'fraud-service', message: 'Fraud score computed', metadata: { score: 12, threshold: 70, result: 'pass' } },
  { level: 'INFO', service: 'config-service', message: 'Feature flags evaluated', metadata: { flagCount: 5, overrideCount: 1 } },
  { level: 'INFO', service: 'checkout-service', message: 'Page navigation complete', metadata: { from: 'insurance', to: 'payment' } },
  { level: 'INFO', service: 'auth-service', message: '3DS authentication passed', metadata: { eci: '05', cavv: 'AAABI4HHigAAAAAAAAAAAAAAAAA=' } },
  { level: 'INFO', service: 'payment-service', message: 'Refund processed successfully', metadata: { refundId: 'ref_001', amount: 50.0 } },
  { level: 'WARN', service: 'payment-service', message: 'Retry attempt 2/3 for payment authorization', metadata: { attempt: 2, reason: 'gateway_timeout' } },
  { level: 'WARN', service: 'auth-service', message: '3DS challenge triggered', metadata: { cardBrand: 'VISA', challengeType: 'OTP' } },
  { level: 'WARN', service: 'config-service', message: 'Config cache miss — fetching from origin', metadata: { merchantId: 'acc_001', latency: 342 } },
  { level: 'WARN', service: 'fraud-service', message: 'Elevated fraud score detected', metadata: { score: 62, threshold: 70, action: 'review' } },
  { level: 'WARN', service: 'checkout-service', message: 'Session approaching expiry', metadata: { remainingSeconds: 180 } },
  {
    level: 'WARN',
    service: 'payment-service',
    message: 'Fallback provider selected after primary timeout',
    metadata: { primary: 'Cybersource', fallback: 'GiftCard' },
  },
  { level: 'WARN', service: 'config-service', message: 'Deprecated config field detected', metadata: { field: 'applicationConfigs', version: '0.9.1' } },
  {
    level: 'ERROR',
    service: 'payment-service',
    message: 'Payment authorization failed: card declined',
    metadata: { code: 'CARD_DECLINED', reasonCode: '481' },
  },
  { level: 'ERROR', service: 'payment-service', message: 'Integration timeout: Cybersource', metadata: { timeoutMs: 5000, attempt: 3 } },
  { level: 'ERROR', service: 'config-service', message: 'Config validation failed', metadata: { errors: ['missing merchant.id', 'invalid primaryColor'] } },
  { level: 'ERROR', service: 'fraud-service', message: 'Fraud service unreachable', metadata: { endpoint: 'https://api.accertify.com', statusCode: 503 } },
  { level: 'ERROR', service: 'auth-service', message: '3DS authentication failed — max retries exceeded', metadata: { attempts: 3, finalStatus: 'failure' } },
  { level: 'ERROR', service: 'checkout-service', message: 'Order total mismatch on submit', metadata: { expectedTotal: 299.0, actualTotal: 249.0 } },
  {
    level: 'DEBUG',
    service: 'payment-service',
    message: 'Provider selected: CyberSource',
    metadata: { selectionStrategy: 'priority', candidates: ['Cybersource', 'GiftCard'] },
  },
  { level: 'DEBUG', service: 'config-service', message: 'Resolving config precedence', metadata: { layers: ['tenant', 'merchant', 'session'] } },
  { level: 'DEBUG', service: 'checkout-service', message: 'Iframe resize event received', metadata: { width: 480, height: 312 } },
  { level: 'DEBUG', service: 'fraud-service', message: 'Device fingerprint collected', metadata: { fingerprintId: 'fp_9a2b3c', collectionMs: 78 } },
  { level: 'DEBUG', service: 'auth-service', message: 'JWT token decoded', metadata: { sub: 'user_001', exp: 1711238400 } },
  { level: 'DEBUG', service: 'payment-service', message: 'Payment method validation passed', metadata: { method: 'APL', cardBrand: 'VISA' } },
  { level: 'DEBUG', service: 'config-service', message: 'Integration registry loaded', metadata: { count: 7, cached: false } },
];

const ALL_MERCHANT_IDS = MOCK_MERCHANTS.map((m) => m.id);
const ALL_TENANT_IDS_FOR_MERCHANT: Record<string, string> = {};
MOCK_MERCHANTS.forEach((m) => {
  ALL_TENANT_IDS_FOR_MERCHANT[m.id] = m.tenantId;
});

// Reference timestamp: 2026-03-25T12:00:00Z = 1743076800000
const REF_TS = 1743076800000;

export const MOCK_LOGS: LogEntry[] = Array.from({ length: 60 }, (_, i) => {
  const template = LOG_MESSAGES[i % LOG_MESSAGES.length];
  const merchantId = ALL_MERCHANT_IDS[i % ALL_MERCHANT_IDS.length];
  const offsetMs = Math.floor((i / 60) * 24 * 60 * 60 * 1000);
  const ts = new Date(REF_TS - offsetMs).toISOString();
  return {
    id: `log_${String(i + 1).padStart(4, '0')}`,
    timestamp: ts,
    level: template.level,
    service: template.service,
    merchantId,
    tenantId: ALL_TENANT_IDS_FOR_MERCHANT[merchantId],
    message: template.message,
    metadata: template.metadata,
  };
});

// ─── Analytics ───────────────────────────────────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const MOCK_ANALYTICS: AnalyticsMetric[] = (() => {
  const entries: AnalyticsMetric[] = [];
  // 30 days ending at REF_TS
  for (let d = 29; d >= 0; d--) {
    const date = new Date(REF_TS - d * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    ALL_MERCHANT_IDS.forEach((merchantId, mi) => {
      const merchant = MOCK_MERCHANTS[mi];
      const seed = d * 100 + mi;
      const r1 = seededRand(seed);
      const r2 = seededRand(seed + 50);
      const r3 = seededRand(seed + 100);
      const transactions = Math.floor(50 + r1 * 450);
      const successRate = 0.85 + r2 * 0.13;
      const successCount = Math.floor(transactions * successRate);
      const failureCount = transactions - successCount;
      const revenue = Math.floor((500 + r3 * 49500) * 100) / 100;
      // GA-style sessions: typical checkout conversion ~8–14%
      const sessions = Math.floor(successCount / (0.08 + seededRand(seed + 150) * 0.06));

      // Payment method breakdown — keyed by real payment_method_code from DB
      const cfg = merchant?.config;
      const intgs = cfg?.integrations ?? [];
      const appCfgs = cfg?.applicationConfigs ?? [];
      // Derive which PM codes this merchant supports
      const hasApplePay = intgs.some(
        (i) => i.provider === 'Cybersource' && i.enabled &&
               (i.settings?.paymentMethods?.APL?.length ?? 0) > 0
      );
      const hasPPA = appCfgs.some((r) => r.name === 'paypal');
      const hasSVC = intgs.some((i) => i.provider === 'StoredValue' && i.enabled);
      const hasUPL = appCfgs.some((r) => r.name === 'uplift');
      const hasAZP = appCfgs.some((r) => r.name === 'amazon_pay');
      const hasTRU = appCfgs.some((r) => r.name === 'trustly');

      const byPaymentMethod: Record<string, number> = {};
      let remaining = successCount;

      if (hasApplePay) {
        const n = Math.floor(successCount * (0.06 + seededRand(seed + 158) * 0.08));
        byPaymentMethod['APL'] = n; remaining -= n;
      }
      if (hasPPA) {
        const n = Math.floor(successCount * (0.12 + seededRand(seed + 160) * 0.13));
        byPaymentMethod['PPA'] = n; remaining -= n;
      }
      if (hasSVC) {
        const n = Math.floor(successCount * (0.04 + seededRand(seed + 161) * 0.08));
        byPaymentMethod['SVC'] = n; remaining -= n;
      }
      if (hasUPL) {
        const n = Math.floor(successCount * (0.03 + seededRand(seed + 162) * 0.05));
        byPaymentMethod['UPL'] = n; remaining -= n;
      }
      if (hasAZP) {
        const n = Math.floor(successCount * (0.02 + seededRand(seed + 163) * 0.04));
        byPaymentMethod['AZP'] = n; remaining -= n;
      }
      if (hasTRU) {
        const n = Math.floor(successCount * (0.02 + seededRand(seed + 164) * 0.04));
        byPaymentMethod['TRU'] = n; remaining -= n;
      }
      byPaymentMethod['CCD'] = Math.max(0, remaining);

      entries.push({ merchantId, date: dateStr, sessions, transactions, successCount, failureCount, revenue, byPaymentMethod });
    });
  }
  return entries;
})();

// ─── Utility exports ─────────────────────────────────────────────────────────

export function getTenantsForStack(stackId: string): Tenant[] {
  return MOCK_TENANTS.filter((t) => t.stackId === stackId);
}

export function getMerchantsForStack(stackId: string): Merchant[] {
  const tenantIds = getTenantsForStack(stackId).map((t) => t.id);
  return MOCK_MERCHANTS.filter((m) => tenantIds.includes(m.tenantId));
}

export function getMerchantsForTenant(tenantId: string): Merchant[] {
  return MOCK_MERCHANTS.filter((m) => m.tenantId === tenantId);
}

export function getMerchantById(id: string): Merchant | undefined {
  return MOCK_MERCHANTS.find((m) => m.id === id);
}

export function getStackById(stackId: string): Stack | undefined {
  return MOCK_STACKS.find((s) => s.id === stackId);
}

export function getLogsForMerchant(merchantId: string): LogEntry[] {
  return MOCK_LOGS.filter((l) => l.merchantId === merchantId);
}

export function getAnalyticsForMerchant(merchantId: string): AnalyticsMetric[] {
  return MOCK_ANALYTICS.filter((a) => a.merchantId === merchantId);
}

export function createDefaultMerchantConfig(id: string, tenantId: string, name: string): MerchantConfig {
  return {
    version: '1.0.0',
    merchant: {
      id,
      tenantId,
      name,
      theme: { primaryColor: '#3b82f6', secondaryColor: '#93c5fd', fontFamily: 'Inter', borderRadius: '8px', applyLayoutColor: 'false' },
    },
    applicationConfigs: [],
    navigation: {
      pages: buildPages(id, { insuranceEnabled: true, payMonthlyEnabled: false, paymentEnabled: true }).filter((p) => p.enabled),
      currentPageIndex: 0,
      allowSkip: false,
      showProgress: true,
    },
    integrations: buildIntegrations(id, {
      cybersourceEnabled: false,
      storedValueEnabled: false,
      paypalEnabled: false,
      accertifyEnabled: false,
      riskEnabled: false,
      ticketGuardianEnabled: false,
      donationEnabled: false,
    }),
    featureFlags: buildFeatureFlags({ skipPayment: false, enable3ds: false, guestCheckout: true }),
    locales: { locale: 'en-US', namespaces: [] },
  };
}
