import type { MerchantConfig } from '../data/mock';
import { getAccumulatedMigrations, LATEST_VERSION, type MigrationField } from '../data/releases';

export interface MigrationFieldStatus extends MigrationField {
  currentValue: any; // what's in the config right now (undefined if missing)
  hasValue: boolean; // whether the field already exists
  proposedValue: any; // what the user/AI has set for this migration
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  fields: MigrationFieldStatus[];
  merchantId: string;
  merchantName: string;
}

export interface AiFieldSuggestion {
  fieldId: string;
  suggestedValue: any;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AiAnalysis {
  summary: string;
  fieldSuggestions: AiFieldSuggestion[];
}

// ─── Utility: get a value at a simplified path ─────────────────────────────

function getValueAtPath(config: MerchantConfig, path: string): any {
  // Simplified path resolution for our schema paths
  if (path === 'navigation.allowSkip') return config.navigation.allowSkip;
  if (path === 'navigation.showProgress') return config.navigation.showProgress;
  if (path === 'merchant.theme.applyLayoutColor') return config.merchant.theme.applyLayoutColor;

  if (path.startsWith('navigation.pages[')) {
    const match = path.match(/navigation\.pages\[([^\]]+)\]\.(.+)/);
    if (!match) return undefined;
    const [, pageId, rest] = match;
    const page = config.navigation.pages.find((p) => p.id === pageId);
    if (!page) return undefined;
    if (rest === 'enabled') return page.enabled;
    const compMatch = rest.match(/components\[([^\]]+)\]\.(.+)/);
    if (!compMatch) return undefined;
    const [, compType, featurePath] = compMatch;
    const comp = page.components.find((c) => c.componentType === compType);
    if (!comp) return undefined;
    const featureKey = featurePath.replace('features.', '');
    return comp.features[featureKey];
  }

  if (path.startsWith('integrations[')) {
    const match = path.match(/integrations\[([^\]]+)\]\.settings\.(.+)/);
    if (!match) return undefined;
    const [, provider, settingPath] = match;
    const intg = config.integrations.find((i) => i.provider === provider);
    if (!intg) return undefined;
    if (settingPath.includes('[')) {
      // e.g. fundingSources[venmo].enabled
      const fsMatch = settingPath.match(/fundingSources\[([^\]]+)\]\.(.+)/);
      if (!fsMatch) return undefined;
      const [, source, field] = fsMatch;
      const fs = intg.settings.fundingSources?.find((f: any) => f.source === source);
      return fs?.[field];
    }
    return intg.settings[settingPath];
  }

  return undefined;
}

// ─── Migration plan ────────────────────────────────────────────────────────

export function getMigrationPlan(config: MerchantConfig, targetVersion = LATEST_VERSION): MigrationPlan {
  const fromVersion = config.version ?? '1.0.0';
  const fields = getAccumulatedMigrations(fromVersion, targetVersion);

  const fieldStatuses: MigrationFieldStatus[] = fields.map((field) => {
    const currentValue = getValueAtPath(config, field.path);
    const hasValue = currentValue !== undefined && currentValue !== null;
    return {
      ...field,
      currentValue,
      hasValue,
      proposedValue: hasValue ? currentValue : field.defaultValue,
    };
  });

  return {
    fromVersion,
    toVersion: targetVersion,
    fields: fieldStatuses,
    merchantId: config.merchant.id,
    merchantName: config.merchant.name,
  };
}

// ─── Apply migration ───────────────────────────────────────────────────────

export function applyMigration(config: MerchantConfig, fieldValues: Record<string, any>, targetVersion = LATEST_VERSION): MerchantConfig {
  const updated: MerchantConfig = JSON.parse(JSON.stringify(config));
  updated.version = targetVersion;

  for (const [fieldId, value] of Object.entries(fieldValues)) {
    const plan = getMigrationPlan(config, targetVersion);
    const field = plan.fields.find((f) => f.id === fieldId);
    if (!field) continue;
    writeValueAtPath(updated, field.path, value);
  }

  return updated;
}

function writeValueAtPath(config: MerchantConfig, path: string, value: any) {
  if (path === 'navigation.allowSkip') {
    config.navigation.allowSkip = value;
    return;
  }
  if (path === 'navigation.showProgress') {
    config.navigation.showProgress = value;
    return;
  }
  if (path === 'merchant.theme.applyLayoutColor') {
    config.merchant.theme.applyLayoutColor = String(value);
    return;
  }

  if (path.startsWith('navigation.pages[')) {
    const match = path.match(/navigation\.pages\[([^\]]+)\]\.(.+)/);
    if (!match) return;
    const [, pageId, rest] = match;
    const page = config.navigation.pages.find((p) => p.id === pageId);
    if (!page) return;
    if (rest === 'enabled') {
      page.enabled = value;
      return;
    }
    const compMatch = rest.match(/components\[([^\]]+)\]\.(.+)/);
    if (!compMatch) return;
    const [, compType, featurePath] = compMatch;
    const comp = page.components.find((c) => c.componentType === compType);
    if (!comp) return;
    const featureKey = featurePath.replace('features.', '');
    comp.features[featureKey] = value;
    return;
  }

  if (path.startsWith('integrations[')) {
    const match = path.match(/integrations\[([^\]]+)\]\.settings\.(.+)/);
    if (!match) return;
    const [, provider, settingPath] = match;
    const intg = config.integrations.find((i) => i.provider === provider);
    if (!intg) return;
    if (settingPath.includes('[')) {
      const fsMatch = settingPath.match(/fundingSources\[([^\]]+)\]\.(.+)/);
      if (!fsMatch) return;
      const [, source, field] = fsMatch;
      const fs = intg.settings.fundingSources?.find((f: any) => f.source === source);
      if (fs) fs[field] = value;
      return;
    }
    intg.settings[settingPath] = value;
  }
}

// ─── AI analysis (simulated) ───────────────────────────────────────────────

export async function generateAiAnalysis(config: MerchantConfig, plan: MigrationPlan): Promise<AiAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const suggestions: AiFieldSuggestion[] = [];
  const merchantName = config.merchant.name;
  const hasCybersource = config.integrations.find((i) => i.provider === 'Cybersource' && i.enabled);
  const hasStoredValue = config.integrations.find((i) => i.provider === 'GiftCard' && i.enabled);
  const hasPayPal = config.integrations.find((i) => i.provider === 'PayPal' && i.enabled);
  const hasTicketGuardian = config.integrations.find((i) => i.provider === 'TicketGuardian' && i.enabled);
  const hasDonation = config.integrations.find((i) => i.provider === 'CustomDonationProvider' && i.enabled);
  const insurancePage = config.navigation.pages.find((p) => p.id === 'insurance');
  const payMonthlyPage = config.navigation.pages.find((p) => p.id === 'pay-monthly');
  const donationComp = insurancePage?.components.find((c) => c.componentType === 'donation');
  const primaryColor = config.merchant.theme.primaryColor;

  const summaryParts: string[] = [`${merchantName} is currently on schema ${plan.fromVersion} and needs to migrate to ${plan.toVersion}.`];

  for (const field of plan.fields) {
    switch (field.id) {
      case 'hide_header':
        suggestions.push({
          fieldId: 'hide_header',
          suggestedValue: true,
          rationale:
            'Hiding the header reduces visual clutter in embedded checkout flows. Recommended for all merchants unless the payment form is displayed standalone.',
          confidence: 'high',
        });
        break;

      case 'skip_payment_selection':
        suggestions.push({
          fieldId: 'skip_payment_selection',
          suggestedValue: false,
          rationale: `${merchantName} has ${hasCybersource ? 'Cybersource' : ''}${hasStoredValue ? ', GiftCard' : ''}${hasPayPal ? ', PayPal' : ''} enabled — multiple payment methods means customers should choose. Only skip if this merchant has a single payment method.`,
          confidence: 'high',
        });
        break;

      case 'full_demographic':
        suggestions.push({
          fieldId: 'full_demographic',
          suggestedValue: false,
          rationale:
            'Full demographic methods adds region-specific payment options. Recommend leaving disabled until market-specific rollout is confirmed for this merchant.',
          confidence: 'medium',
        });
        break;

      case 'cs_ignore_avs':
        suggestions.push({
          fieldId: 'cs_ignore_avs',
          suggestedValue: false,
          rationale: hasCybersource
            ? 'Cybersource is active. Keeping AVS enabled is strongly recommended for fraud prevention — only disable if your payment gateway manages AVS upstream.'
            : 'Cybersource is not active for this merchant, but the default should remain false for when it is enabled.',
          confidence: 'high',
        });
        break;

      case 'cs_ignore_cvv':
        suggestions.push({
          fieldId: 'cs_ignore_cvv',
          suggestedValue: false,
          rationale:
            'CVV verification should remain enabled. Disabling CVV is only appropriate in markets where card-not-present CVV collection is legally restricted.',
          confidence: 'high',
        });
        break;

      case 'sv_ignore_avs':
        suggestions.push({
          fieldId: 'sv_ignore_avs',
          suggestedValue: false,
          rationale: hasStoredValue
            ? 'GiftCard (gift cards) typically bypass AVS since cards are issued internally. However, keeping it as false is safe unless the issuing system explicitly handles AVS.'
            : 'GiftCard is not active — defaulting to false.',
          confidence: 'medium',
        });
        break;

      case 'apply_layout_color': {
        const isVibrantColor = primaryColor !== '#ffffff' && primaryColor !== '#000000';
        suggestions.push({
          fieldId: 'apply_layout_color',
          suggestedValue: isVibrantColor,
          rationale: `${merchantName}'s primary brand color is ${primaryColor}. ${isVibrantColor ? 'Applying it to the layout chrome would reinforce brand identity in the checkout experience.' : 'The primary color is neutral — applying it may not add visual value. Recommended to keep disabled.'}`,
          confidence: isVibrantColor ? 'medium' : 'high',
        });
        break;
      }

      case 'ins_page_enabled':
        suggestions.push({
          fieldId: 'ins_page_enabled',
          suggestedValue: hasTicketGuardian,
          rationale: hasTicketGuardian
            ? `TicketGuardian is enabled for ${merchantName} — enabling the insurance page ensures customers can see insurance offerings during checkout.`
            : `TicketGuardian is not configured for ${merchantName}. Recommend leaving the insurance page disabled until the integration is set up.`,
          confidence: 'high',
        });
        break;

      case 'donation_amounts': {
        const existingAmounts = donationComp?.features?.amounts;
        suggestions.push({
          fieldId: 'donation_amounts',
          suggestedValue: existingAmounts ?? [1, 2, 5, 10],
          rationale: existingAmounts
            ? `Carrying forward existing amounts: $${(existingAmounts as number[]).join(', $')}. Consider adding $10 for higher-value events.`
            : 'Default amounts $1, $2, $5, $10 cover a broad range for most event types. Adjust based on average ticket price.',
          confidence: existingAmounts ? 'high' : 'medium',
        });
        break;
      }

      case 'donation_enable_rounding':
        suggestions.push({
          fieldId: 'donation_enable_rounding',
          suggestedValue: hasDonation,
          rationale: hasDonation
            ? 'Donation integration is active. Round-up donations are a low-friction fundraising mechanism with high conversion rates at checkout.'
            : 'Donation provider not active — recommend disabling until configured.',
          confidence: 'medium',
        });
        break;

      case 'donation_custom_amount':
        suggestions.push({
          fieldId: 'donation_custom_amount',
          suggestedValue: true,
          rationale:
            'Allowing custom amounts accommodates high-intent donors. Rarely reduces conversion and is recommended for all donation-enabled merchants.',
          confidence: 'high',
        });
        break;

      case 'insurance_split':
        suggestions.push({
          fieldId: 'insurance_split',
          suggestedValue: false,
          rationale:
            'Split insurance distributes the premium across order items. Only enable if the insurance provider agreement requires per-item pricing for this merchant.',
          confidence: 'high',
        });
        break;

      case 'tg_split_insurance':
        suggestions.push({
          fieldId: 'tg_split_insurance',
          suggestedValue: false,
          rationale: 'Mirrors the component-level split insurance setting. Keep aligned with the insurance component configuration above.',
          confidence: 'high',
        });
        break;

      case 'show_progress':
        suggestions.push({
          fieldId: 'show_progress',
          suggestedValue: true,
          rationale: `Progress indicators reduce checkout abandonment by setting customer expectations. Recommended on for ${merchantName} given their multi-step flow.`,
          confidence: 'medium',
        });
        break;

      case 'allow_skip':
        suggestions.push({
          fieldId: 'allow_skip',
          suggestedValue: false,
          rationale: `Allowing skips is appropriate for optional steps (e.g. insurance, donation). ${payMonthlyPage?.enabled ? 'Pay Monthly is enabled for this merchant — consider whether skipping it should be allowed.' : 'Recommend leaving disabled to ensure all required steps are completed.'}`,
          confidence: 'medium',
        });
        break;

      case 'pay_monthly_enabled':
        suggestions.push({
          fieldId: 'pay_monthly_enabled',
          suggestedValue: false,
          rationale: `Pay Monthly requires a FlexPay API key to be functional. ${payMonthlyPage ? 'This merchant already has the pay-monthly page configured.' : 'Recommend leaving disabled until FlexPay credentials are obtained for this merchant.'}`,
          confidence: 'medium',
        });
        break;

      case 'flexpay_api_key':
        suggestions.push({
          fieldId: 'flexpay_api_key',
          suggestedValue: '',
          rationale: 'A sandbox or production FlexPay API key is required. Contact your FlexPay account manager to obtain credentials for this merchant.',
          confidence: 'low',
        });
        break;

      case 'paypal_venmo_enabled':
        suggestions.push({
          fieldId: 'paypal_venmo_enabled',
          suggestedValue: false,
          rationale: hasPayPal
            ? `PayPal is active for ${merchantName}. Venmo is currently US-only and works best for younger demographics. Enable if this merchant's audience skews under 35.`
            : 'PayPal is not active — Venmo setting is not applicable.',
          confidence: hasPayPal ? 'low' : 'high',
        });
        break;
    }
  }

  // Build summary
  const newFieldCount = plan.fields.filter((f) => !f.hasValue).length;
  const highConfCount = suggestions.filter((s) => s.confidence === 'high').length;
  summaryParts.push(
    `This migration introduces ${plan.fields.length} field${plan.fields.length !== 1 ? 's' : ''}, of which ${newFieldCount} ${newFieldCount === 1 ? 'is' : 'are'} new to this config.`
  );
  if (hasCybersource) summaryParts.push('Cybersource is active — AVS and CVV settings should be carefully reviewed before publishing.');
  if (hasTicketGuardian && !insurancePage?.enabled)
    summaryParts.push('TicketGuardian is configured but the insurance page is currently disabled — consider enabling it to expose insurance to customers.');
  summaryParts.push(`${highConfCount} of ${suggestions.length} suggestions are high-confidence and safe to apply without review.`);

  return {
    summary: summaryParts.join(' '),
    fieldSuggestions: suggestions,
  };
}
