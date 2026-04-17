export interface LocaleRecord {
  application_id: string;
  language: string;
  section: string;
  target: string;
  value: string;
}

export interface MerchantLocaleOverride extends LocaleRecord {
  merchantId: string;
  tenantId: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en',    label: 'English (Base)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-CA', label: 'English (Canada)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ja',    label: 'Japanese' },
  { code: 'fr-CA', label: 'French (Canada)' },
];

export const LOCALE_SECTIONS = [
  'donation',
  'insurance',
  'billing',
  'payment',
  'nectarpoints',
  'common',
  'errors',
];

// ── Tenant-level baseline locales (application_id = 1504 = accessoPay) ────────
export const MOCK_TENANT_LOCALES: LocaleRecord[] = [
  // donation
  { application_id: '1504', language: 'en',    section: 'donation', target: 'title',          value: 'Make a Donation' },
  { application_id: '1504', language: 'en-US', section: 'donation', target: 'title',          value: 'Make a Donation' },
  { application_id: '1504', language: 'en-GB', section: 'donation', target: 'title',          value: 'Make a Donation' },
  { application_id: '1504', language: 'ja',    section: 'donation', target: 'title',          value: '寄付をする' },
  { application_id: '1504', language: 'en',    section: 'donation', target: 'subtitle',       value: 'Contribute to a supported initiative' },
  { application_id: '1504', language: 'en-US', section: 'donation', target: 'subtitle',       value: 'Contribute to a supported initiative' },
  { application_id: '1504', language: 'ja',    section: 'donation', target: 'subtitle',       value: 'サポートされているイニシアチブに貢献する' },
  { application_id: '1504', language: 'en',    section: 'donation', target: 'customAmount',   value: 'Custom Amount' },
  { application_id: '1504', language: 'en-US', section: 'donation', target: 'customAmount',   value: 'Custom Amount' },
  { application_id: '1504', language: 'ja',    section: 'donation', target: 'customAmount',   value: 'カスタム金額' },
  { application_id: '1504', language: 'en',    section: 'donation', target: 'roundUp',        value: 'Round up my purchase' },
  { application_id: '1504', language: 'en-US', section: 'donation', target: 'roundUp',        value: 'Round up my purchase' },

  // insurance
  { application_id: '1504', language: 'en',    section: 'insurance', target: 'title',         value: 'Ticket Protection' },
  { application_id: '1504', language: 'en-US', section: 'insurance', target: 'title',         value: 'Ticket Protection' },
  { application_id: '1504', language: 'en-GB', section: 'insurance', target: 'title',         value: 'Ticket Protection' },
  { application_id: '1504', language: 'ja',    section: 'insurance', target: 'title',         value: 'チケット保護' },
  { application_id: '1504', language: 'en',    section: 'insurance', target: 'addLabel',      value: 'Add ticket protection' },
  { application_id: '1504', language: 'en-US', section: 'insurance', target: 'addLabel',      value: 'Add ticket protection' },
  { application_id: '1504', language: 'ja',    section: 'insurance', target: 'addLabel',      value: 'チケット保護を追加する' },
  { application_id: '1504', language: 'en',    section: 'insurance', target: 'declineLabel',  value: 'No thanks' },
  { application_id: '1504', language: 'en-US', section: 'insurance', target: 'declineLabel',  value: 'No thanks' },
  { application_id: '1504', language: 'ja',    section: 'insurance', target: 'declineLabel',  value: 'いいえ、結構です' },

  // billing
  { application_id: '1504', language: 'en',    section: 'billing', target: 'firstName',       value: 'First name' },
  { application_id: '1504', language: 'en-US', section: 'billing', target: 'firstName',       value: 'First name' },
  { application_id: '1504', language: 'ja',    section: 'billing', target: 'firstName',       value: '名' },
  { application_id: '1504', language: 'en',    section: 'billing', target: 'lastName',        value: 'Last name' },
  { application_id: '1504', language: 'en-US', section: 'billing', target: 'lastName',        value: 'Last name' },
  { application_id: '1504', language: 'ja',    section: 'billing', target: 'lastName',        value: '姓' },
  { application_id: '1504', language: 'en',    section: 'billing', target: 'email',           value: 'Email address' },
  { application_id: '1504', language: 'en-US', section: 'billing', target: 'email',           value: 'Email address' },
  { application_id: '1504', language: 'ja',    section: 'billing', target: 'email',           value: 'メールアドレス' },
  { application_id: '1504', language: 'en',    section: 'billing', target: 'giftcard',        value: 'Gift Card' },
  { application_id: '1504', language: 'en-US', section: 'billing', target: 'giftcard',        value: 'Gift Card' },
  { application_id: '1504', language: 'ja',    section: 'billing', target: 'giftcard',        value: 'ギフトカード' },

  // payment
  { application_id: '1504', language: 'en',    section: 'payment', target: 'title',           value: 'Payment method' },
  { application_id: '1504', language: 'en-US', section: 'payment', target: 'title',           value: 'Payment method' },
  { application_id: '1504', language: 'ja',    section: 'payment', target: 'title',           value: 'お支払い方法' },
  { application_id: '1504', language: 'en',    section: 'payment', target: 'secureMessage',   value: 'Transactions are secured and encrypted' },
  { application_id: '1504', language: 'en-US', section: 'payment', target: 'secureMessage',   value: 'Transactions are secured and encrypted' },
  { application_id: '1504', language: 'ja',    section: 'payment', target: 'secureMessage',   value: 'トランザクションは保護および暗号化されています' },
  { application_id: '1504', language: 'en',    section: 'payment', target: 'continueBtn',     value: 'Continue' },
  { application_id: '1504', language: 'en-US', section: 'payment', target: 'continueBtn',     value: 'Continue' },
  { application_id: '1504', language: 'ja',    section: 'payment', target: 'continueBtn',     value: '続ける' },

  // nectarpoints
  { application_id: '1504', language: 'en',    section: 'nectarpoints', target: 'accountlinkerrorheading', value: 'Unable to link Nectar account' },
  { application_id: '1504', language: 'en-US', section: 'nectarpoints', target: 'accountlinkerrorheading', value: 'Unable to link Nectar account' },
  { application_id: '1504', language: 'en-CA', section: 'nectarpoints', target: 'accountlinkerrorheading', value: 'Unable to link Nectar account' },
  { application_id: '1504', language: 'en-GB', section: 'nectarpoints', target: 'accountlinkerrorheading', value: 'Unable to link Nectar account' },
  { application_id: '1504', language: 'en',    section: 'nectarpoints', target: 'linkbtnlabel',            value: 'Link Nectar card' },
  { application_id: '1504', language: 'en-US', section: 'nectarpoints', target: 'linkbtnlabel',            value: 'Link Nectar card' },
  { application_id: '1504', language: 'en-GB', section: 'nectarpoints', target: 'linkbtnlabel',            value: 'Link Nectar card' },
  { application_id: '1504', language: 'en',    section: 'nectarpoints', target: 'pointsbalance',           value: 'Nectar points balance' },
  { application_id: '1504', language: 'en-GB', section: 'nectarpoints', target: 'pointsbalance',           value: 'Nectar points balance' },

  // common
  { application_id: '1504', language: 'en',    section: 'common', target: 'back',             value: 'Back' },
  { application_id: '1504', language: 'en-US', section: 'common', target: 'back',             value: 'Back' },
  { application_id: '1504', language: 'ja',    section: 'common', target: 'back',             value: '戻る' },
  { application_id: '1504', language: 'en',    section: 'common', target: 'cancel',           value: 'Cancel' },
  { application_id: '1504', language: 'en-US', section: 'common', target: 'cancel',           value: 'Cancel' },
  { application_id: '1504', language: 'ja',    section: 'common', target: 'cancel',           value: 'キャンセル' },

  // errors
  { application_id: '1504', language: 'en',    section: 'errors', target: 'genericError',     value: 'Something went wrong. Please try again.' },
  { application_id: '1504', language: 'en-US', section: 'errors', target: 'genericError',     value: 'Something went wrong. Please try again.' },
  { application_id: '1504', language: 'ja',    section: 'errors', target: 'genericError',     value: 'エラーが発生しました。もう一度お試しください。' },
  { application_id: '1504', language: 'en',    section: 'errors', target: 'paymentDeclined',  value: 'Payment was declined. Please check your details.' },
  { application_id: '1504', language: 'en-US', section: 'errors', target: 'paymentDeclined',  value: 'Payment was declined. Please check your details.' },
  { application_id: '1504', language: 'ja',    section: 'errors', target: 'paymentDeclined',  value: '支払いが拒否されました。詳細を確認してください。' },
];

// ── Merchant-level overrides ───────────────────────────────────────────────────
export const MOCK_MERCHANT_LOCALE_OVERRIDES: MerchantLocaleOverride[] = [
  // Cedar Fair merchant cf_001 overrides donation title for en-US
  { application_id: '1504', merchantId: 'cf_001', tenantId: 'tenant_cedarfair', language: 'en-US', section: 'donation', target: 'title',    value: 'Support Our Park' },
  { application_id: '1504', merchantId: 'cf_001', tenantId: 'tenant_cedarfair', language: 'en-US', section: 'donation', target: 'subtitle', value: 'Every dollar goes toward park improvements' },
  // Six Flags sf_001 overrides insurance title
  { application_id: '1504', merchantId: 'sf_001', tenantId: 'tenant_sixflags',  language: 'en-US', section: 'insurance', target: 'title',   value: 'Ride Protection Plan' },
  { application_id: '1504', merchantId: 'sf_001', tenantId: 'tenant_sixflags',  language: 'en-US', section: 'insurance', target: 'addLabel', value: 'Add ride protection' },
];

export function getTenantLocales(applicationId: string, section: string, language: string): LocaleRecord[] {
  return MOCK_TENANT_LOCALES.filter(
    (l) => l.application_id === applicationId && l.section === section && l.language === language
  );
}

export function getMerchantOverrides(merchantId: string, applicationId: string, section: string, language: string): MerchantLocaleOverride[] {
  return MOCK_MERCHANT_LOCALE_OVERRIDES.filter(
    (l) => l.merchantId === merchantId && l.application_id === applicationId && l.section === section && l.language === language
  );
}

export function getLanguagesForSection(applicationId: string, section: string): string[] {
  return [...new Set(MOCK_TENANT_LOCALES.filter((l) => l.application_id === applicationId && l.section === section).map((l) => l.language))];
}
