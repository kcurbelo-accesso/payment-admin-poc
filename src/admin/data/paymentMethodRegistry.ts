// Payment method registry — sourced from DB table `payment_methods`
// id, name, payment_method_code as of 2024-09-03

export interface PaymentMethodDef {
  id: number;
  name: string;
  code: string;
  color: string;
  group: 'card' | 'wallet' | 'bnpl' | 'bank' | 'stored-value' | 'apac' | 'regional';
}

export const PAYMENT_METHOD_REGISTRY: PaymentMethodDef[] = [
  { id: 1,  code: 'CCD',  name: 'Credit Card',             color: '#3b82f6', group: 'card'         },
  { id: 2,  code: 'GGL',  name: 'Google Pay',              color: '#4285f4', group: 'card'         },
  { id: 3,  code: 'APL',  name: 'Apple Pay',               color: '#374151', group: 'card'         },
  { id: 4,  code: 'SFT',  name: 'Sofort',                  color: '#0077b5', group: 'bank'         },
  { id: 5,  code: 'IDL',  name: 'iDeal',                   color: '#cc0066', group: 'bank'         },
  { id: 6,  code: 'MRM',  name: 'Bancontact Mobile',       color: '#005499', group: 'regional'     },
  { id: 7,  code: 'BCMC', name: 'Bancontact Desktop',      color: '#005499', group: 'regional'     },
  { id: 8,  code: 'KCP',  name: 'Korean Cyber Payments',   color: '#e61e25', group: 'apac'         },
  { id: 9,  code: 'GPY',  name: 'GiroPay',                 color: '#000268', group: 'bank'         },
  { id: 10, code: 'EPS',  name: 'Electronic Payment Std.', color: '#c8102e', group: 'bank'         },
  { id: 11, code: 'ALI',  name: 'AliPay',                  color: '#1677ff', group: 'apac'         },
  { id: 12, code: 'ALH',  name: 'AliPay HK',               color: '#1677ff', group: 'apac'         },
  { id: 13, code: 'KAK',  name: 'Kakao Pay',               color: '#f59e0b', group: 'apac'         },
  { id: 14, code: 'WCQ',  name: 'WeChatPay QR',            color: '#07c160', group: 'apac'         },
  { id: 15, code: 'WCS',  name: 'WeChatPay SDK',           color: '#07c160', group: 'apac'         },
  { id: 16, code: 'LNP',  name: 'LinePay',                 color: '#06c755', group: 'apac'         },
  { id: 17, code: 'PPA',  name: 'PayPal',                  color: '#003087', group: 'wallet'       },
  { id: 18, code: 'SVC',  name: 'Stored Value',            color: '#10b981', group: 'stored-value' },
  { id: 19, code: 'SDD',  name: 'SEPA Direct Debit',       color: '#6366f1', group: 'bank'         },
  { id: 20, code: 'UPL',  name: 'Uplift',                  color: '#8b5cf6', group: 'bnpl'         },
  { id: 21, code: 'NVP',  name: 'NaverPay',                color: '#03c75a', group: 'apac'         },
  { id: 22, code: 'GRP',  name: 'GrabPay',                 color: '#00b14f', group: 'apac'         },
  { id: 23, code: 'WCP',  name: 'WeChatPay',               color: '#07c160', group: 'apac'         },
  { id: 24, code: 'MBW',  name: 'MBWay',                   color: '#e30613', group: 'regional'     },
  { id: 25, code: 'MPY',  name: 'MobilePay',               color: '#5a78ff', group: 'regional'     },
  { id: 27, code: 'AFT',  name: 'Afterpay',                color: '#b2fce4', group: 'bnpl'         },
  { id: 28, code: 'AZP',  name: 'Amazon Pay',              color: '#ff9900', group: 'wallet'       },
  { id: 30, code: 'TRU',  name: 'Trustly',                 color: '#0ec577', group: 'bank'         },
  { id: 31, code: 'KPN',  name: 'Klarna Pay Now',          color: '#e8a7c0', group: 'bnpl'         },
  { id: 32, code: 'KPT',  name: 'Klarna Pay Over Time',    color: '#e8a7c0', group: 'bnpl'         },
];

/** Lookup by code — O(1) */
export const PM_BY_CODE = Object.fromEntries(
  PAYMENT_METHOD_REGISTRY.map((pm) => [pm.code, pm])
) as Record<string, PaymentMethodDef>;

/**
 * Maps an integration provider / app config key to the payment method codes
 * that integration contributes.
 */
export const INTEGRATION_TO_PM_CODES: Record<string, string[]> = {
  Cybersource:             ['CCD'],
  StoredValue:             ['SVC'],
  PayPal:                  ['PPA'],    // appconfig key 'paypal'
  Uplift:                  ['UPL'],    // appconfig key 'uplift'
  AmazonPay:               ['AZP'],    // appconfig key 'amazon_pay'
  Trustly:                 ['TRU'],    // appconfig key 'trustly'
  // Cybersource paymentMethods groups also carry:
  APL:                     ['APL'],
  GGL:                     ['GGL'],
};
