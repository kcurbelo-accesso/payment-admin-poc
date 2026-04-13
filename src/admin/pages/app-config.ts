import { getMerchantById, makeDefaultPage, type ComponentConfig, type FeatureFlag, type MerchantConfig, type PageConfig } from '../data/mock';
import {
  PAYMENT_FEATURES,
  PAYMENT_FEATURE_CATEGORIES,
  getFieldValue,
  isFeatureEnabled,
  setFieldValue,
  toggleFeature,
  type PaymentFeatureFieldDef,
} from '../data/paymentFeatures';
import { navigate } from '../router';
import { store } from '../services/store';

const ALL_PAGE_IDS = ['insurance', 'pay-monthly', 'payment'] as const;
const PAGE_ORDER: Record<string, number> = { insurance: 1, 'pay-monthly': 2, payment: 3 };

type OutputTab = 'json' | 'preview' | 'changes' | 'history';

let activeOutputTab: OutputTab = 'json';
let previewPageRoute = '';
const originalConfigs: Record<string, MerchantConfig> = {};

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function buildDiff(original: MerchantConfig, current: MerchantConfig): string[] {
  const diffs: string[] = [];

  const ot = original.merchant.theme;
  const ct = current.merchant.theme;
  if (ot.primaryColor !== ct.primaryColor) diffs.push(`Primary color: ${ot.primaryColor} → ${ct.primaryColor}`);
  if (ot.secondaryColor !== ct.secondaryColor) diffs.push(`Secondary color: ${ot.secondaryColor} → ${ct.secondaryColor}`);
  if (ot.fontFamily !== ct.fontFamily) diffs.push(`Font family: ${ot.fontFamily} → ${ct.fontFamily}`);
  if (ot.borderRadius !== ct.borderRadius) diffs.push(`Border radius: ${ot.borderRadius} → ${ct.borderRadius}`);
  if (original.merchant.name !== current.merchant.name) diffs.push(`Merchant name: "${original.merchant.name}" → "${current.merchant.name}"`);

  if (original.navigation.allowSkip !== current.navigation.allowSkip)
    diffs.push(`Allow skip: ${original.navigation.allowSkip} → ${current.navigation.allowSkip}`);
  if (original.navigation.showProgress !== current.navigation.showProgress)
    diffs.push(`Show progress: ${original.navigation.showProgress} → ${current.navigation.showProgress}`);

  original.featureFlags.forEach((of) => {
    const cf = current.featureFlags.find((f) => f.key === of.key);
    if (cf && cf.enabled !== of.enabled) diffs.push(`Flag '${of.label}': ${of.enabled} → ${cf.enabled}`);
  });

  ALL_PAGE_IDS.forEach((id) => {
    const op = original.navigation.pages.find((p) => p.id === id);
    const cp = current.navigation.pages.find((p) => p.id === id);
    if (!!op !== !!cp) {
      const title = (op ?? cp)!.title;
      diffs.push(`Page '${title}': ${op ? 'enabled' : 'disabled'} → ${cp ? 'enabled' : 'disabled'}`);
      return;
    }
    if (!op || !cp) return;
    op.components.forEach((oc) => {
      const cc = cp.components.find((c) => c.id === oc.id);
      if (!cc) return;
      if (cc.enabled !== oc.enabled)
        diffs.push(`Component '${oc.componentType}' on '${op.title}': ${oc.enabled ? 'enabled' : 'disabled'} → ${cc.enabled ? 'enabled' : 'disabled'}`);
      Object.keys(oc.features).forEach((key) => {
        const ov = JSON.stringify(oc.features[key]);
        const cv = JSON.stringify(cc.features[key]);
        if (ov !== cv) diffs.push(`${op.title} › ${oc.componentType} › ${key}: ${ov} → ${cv}`);
      });
    });
  });

  original.integrations.forEach((oi) => {
    const ci = current.integrations.find((i) => i.id === oi.id);
    if (ci && ci.enabled !== oi.enabled)
      diffs.push(`Integration '${oi.provider}': ${oi.enabled ? 'enabled' : 'disabled'} → ${ci.enabled ? 'enabled' : 'disabled'}`);
  });

  return diffs;
}

function renderComponentFeatureFields(comp: ComponentConfig, pageId: string): string {
  const f = comp.features;
  const so = comp.styleOverrides ?? {};
  const compKey = `${pageId}-${comp.id}`;

  let featuresHtml = '';

  switch (comp.componentType) {
    case 'donation':
      featuresHtml = `
        <div style="margin-bottom: 12px;">
          <label class="form-label">Donation Amounts</label>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;" id="amounts-pills-${compKey}">
            ${((f.amounts as number[]) ?? [])
              .map(
                (a) => `
              <span style="background: #dbeafe; color: #1d4ed8; border-radius: 20px; padding: 3px 10px; font-size: 12px; display: flex; align-items: center; gap: 5px; font-weight: 600;">
                $${a}
                <button data-remove-amount="${a}" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" style="background: none; border: none; cursor: pointer; color: #93c5fd; padding: 0; line-height: 1; font-size: 15px; font-weight: 700; margin-left: 2px;">×</button>
              </span>
            `
              )
              .join('')}
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="number" class="form-input" id="add-amount-${compKey}" min="1" max="1000" placeholder="e.g. 10" style="width: 90px; font-size: 12px; padding: 5px 8px;">
            <button class="btn btn-ghost" data-add-amount-btn data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" style="font-size: 12px; padding: 5px 12px;">+ Add</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div>
            <label class="form-label">Rounding Multiple</label>
            <input type="number" class="form-input feature-number" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" data-feature="roundingMultiple" value="${f.roundingMultiple ?? 0}" style="font-size: 12px;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 20px;">
            ${renderToggleRow('Enable Rounding', 'enableRounding', f.enableRounding ?? false, `feat-${compKey}`)}
            ${renderToggleRow('Custom Amount', 'enableCustomAmount', f.enableCustomAmount ?? false, `feat-${compKey}`)}
            ${renderToggleRow('Split Donation', 'splitDonation', f.splitDonation ?? false, `feat-${compKey}`)}
          </div>
        </div>
      `;
      break;
    case 'insurance':
      featuresHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; align-items: end;">
          <div>
            <label class="form-label">API Key</label>
            <input type="text" class="form-input feature-text" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" data-feature="apiKey" value="${f.apiKey ?? ''}" style="font-size: 12px; font-family: monospace;">
          </div>
          <div style="padding-bottom: 6px;">
            ${renderToggleRow('Split Insurance', 'splitInsurance', f.splitInsurance ?? false, `feat-${compKey}`)}
          </div>
        </div>
      `;
      break;
    case 'pay-later':
      featuresHtml = `
        <div style="margin-bottom: 12px;">
          <label class="form-label">API Key</label>
          <input type="text" class="form-input feature-text" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" data-feature="apiKey" value="${f.apiKey ?? ''}" style="font-size: 12px; font-family: monospace;">
        </div>
      `;
      break;
    case 'payment-method-selector':
      featuresHtml = `
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
          ${renderToggleRow('Hide Header', 'hideHeader', f.hideHeader ?? false, `feat-${compKey}`)}
          ${renderToggleRow('Skip Payment Selection', 'skipPaymentSelection', f.skipPaymentSelection ?? false, `feat-${compKey}`)}
          ${renderToggleRow('Full Demographic Methods', 'fullDemographicMethods', !!f.fullDemographicMethods, `feat-${compKey}`)}
        </div>
      `;
      break;
    default:
      featuresHtml = `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">No editable features for this component type.</div>`;
  }

  const styleOverridesHtml = `
    <div>
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px;">Style Overrides</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        ${renderColorOverride('Primary Color', 'primaryColor', so.primaryColor ?? '', compKey, pageId, comp.id)}
        ${renderColorOverride('Background', 'backgroundColor', so.backgroundColor ?? '', compKey, pageId, comp.id)}
        <div>
          <label class="form-label" style="font-size: 10px;">Border Radius</label>
          <input type="text" class="form-input style-override" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${comp.id}" data-override="borderRadius" value="${so.borderRadius ?? ''}" placeholder="e.g. 4px" style="font-size: 11px;">
        </div>
      </div>
    </div>
  `;

  return `
    <div style="padding: 12px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
      <div style="font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px;">Features</div>
      ${featuresHtml}
      ${styleOverridesHtml}
    </div>
  `;
}

function renderToggleRow(label: string, key: string, value: boolean, prefix: string): string {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
      <span style="font-size: 12px; color: #374151;">${label}</span>
      <label class="toggle-switch" style="flex-shrink: 0;">
        <input type="checkbox" class="feat-toggle" data-feat-key="${key}" data-prefix="${prefix}" ${value ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

function renderColorOverride(label: string, key: string, value: string, compKey: string, pageId: string, compId: string): string {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
  return `
    <div>
      <label class="form-label" style="font-size: 10px;">${label}</label>
      <div style="display: flex; gap: 4px; align-items: center;">
        <input type="color" class="style-override-color" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${compId}" data-override="${key}" value="${safeValue}" style="width: 32px; height: 30px; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; padding: 1px;">
        <input type="text" class="form-input style-override" data-comp-key="${compKey}" data-page-id="${pageId}" data-comp-id="${compId}" data-override="${key}" value="${value}" placeholder="#000000" style="font-size: 10px; font-family: monospace; flex: 1;">
      </div>
    </div>
  `;
}

function renderPaymentFeatureField(featureKey: string, fieldDef: PaymentFeatureFieldDef, config: MerchantConfig): string {
  const val = getFieldValue(config, fieldDef.source);
  const safeVal = val ?? fieldDef.defaultValue ?? '';

  const fieldLabel = `<label style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px;">${fieldDef.label}</label>`;
  const fieldDesc = fieldDef.description ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:5px;">${fieldDef.description}</div>` : '';
  const fieldWarn = fieldDef.warning ? `<div style="font-size:11px;color:#b45309;font-weight:600;margin-bottom:5px;">⚠ ${fieldDef.warning}</div>` : '';

  switch (fieldDef.inputType) {
    case 'boolean':
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <div>
            <div style="font-size:13px;font-weight:500;color:#374151;">${fieldDef.label}</div>
            ${fieldDesc}
          </div>
          <label class="toggle-switch" style="flex-shrink:0;margin-left:16px;" onclick="event.stopPropagation()">
            <input type="checkbox" class="pf-bool" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" ${safeVal ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>`;

    case 'number':
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}${fieldWarn}
          <input class="form-input pf-number" type="number" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" value="${safeVal}" ${fieldDef.min !== undefined ? `min="${fieldDef.min}"` : ''} style="font-size:12px;">
        </div>`;

    case 'select':
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}
          <select class="form-input pf-select" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" style="font-size:12px;">
            ${(fieldDef.options ?? []).map((o) => `<option value="${o.value}" ${safeVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>`;

    case 'color':
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="color" class="pf-color" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" value="${safeVal || '#000000'}" style="width:36px;height:32px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;padding:2px;">
            <span style="font-family:monospace;font-size:12px;color:#64748b;">${safeVal || '—'}</span>
          </div>
        </div>`;

    case 'number-array': {
      const amounts: number[] = Array.isArray(val) ? val : [];
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}${fieldDesc}
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
            ${amounts
              .map(
                (a, idx) => `
              <span style="display:inline-flex;align-items:center;gap:4px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:3px 8px;font-size:12px;font-weight:600;color:#1d4ed8;">
                $${a}
                <button class="pf-amount-remove" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" data-index="${idx}" style="background:none;border:none;color:#93c5fd;cursor:pointer;font-size:13px;padding:0;line-height:1;font-weight:700;" onclick="event.stopPropagation()">×</button>
              </span>`
              )
              .join('')}
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="number" class="form-input pf-amount-input" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" placeholder="e.g. 10" step="0.5" min="0" style="width:90px;font-size:12px;">
            <button class="pf-amount-add" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" style="font-size:11px;padding:5px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;color:#1d4ed8;font-weight:600;cursor:pointer;" onclick="event.stopPropagation()">+ Add</button>
          </div>
        </div>`;
    }

    case 'card-3ds': {
      const allPaymentMethods = (getFieldValue(config, fieldDef.source) ?? {}) as Record<string, any[]>;
      const groupFilter = (fieldDef.source as any).groups as string[] | undefined;
      const paymentMethods = groupFilter ? Object.fromEntries(Object.entries(allPaymentMethods).filter(([g]) => groupFilter.includes(g))) : allPaymentMethods;
      const groupLabels: Record<string, string> = { CCD: 'Credit / Debit', APL: 'Apple Pay', GGL: 'Google Pay' };
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}${fieldDesc}
          ${Object.entries(paymentMethods)
            .map(
              ([group, cards]) => `
            <div style="margin-bottom:8px;">
              <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px;">${groupLabels[group] ?? group}</div>
              <div style="display:flex;flex-direction:column;gap:3px;">
                ${(cards as any[])
                  .map(
                    (card) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:white;border:1px solid #f1f5f9;border-radius:6px;">
                    <div>
                      <span style="font-size:12px;color:#374151;">${card.cardBrand}</span>
                      <span style="font-size:10px;font-family:monospace;color:#94a3b8;margin-left:6px;">${card.cardBrandCode}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${card.enabled3ds ? '<span style="font-size:10px;font-weight:700;color:#15803d;">3DS</span>' : '<span style="font-size:10px;color:#cbd5e1;">3DS</span>'}
                      <label class="toggle-switch" style="transform:scale(0.8);transform-origin:right;" onclick="event.stopPropagation()">
                        <input type="checkbox" class="pf-card-3ds" data-provider="Cybersource" data-group="${group}" data-brand="${card.cardBrandCode}" ${card.enabled3ds ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>`
                  )
                  .join('')}
              </div>
            </div>`
            )
            .join('')}
        </div>`;
    }

    case 'funding-sources': {
      const sources: any[] = Array.isArray(val) ? val : [];
      const knownSources = [
        { key: 'paypal', label: 'PayPal' },
        { key: 'paylater', label: 'Pay Later' },
        { key: 'venmo', label: 'Venmo' },
        { key: 'credit', label: 'Credit (via PayPal)' },
      ];
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}${fieldDesc}
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${knownSources
              .map((s) => {
                const exists = sources.some((f: any) => f.source === s.key);
                return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:white;border:1px solid #f1f5f9;border-radius:6px;">
                  <span style="font-size:12px;color:#374151;">${s.label}</span>
                  <label class="toggle-switch" style="transform:scale(0.85);transform-origin:right;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="pf-funding-source" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" data-source="${s.key}" ${exists ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </div>`;
              })
              .join('')}
          </div>
        </div>`;
    }

    default:
      return `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          ${fieldLabel}${fieldDesc}
          <input class="form-input pf-text" type="text" data-feature-key="${featureKey}" data-field-key="${fieldDef.key}" value="${typeof safeVal === 'string' ? safeVal.replace(/"/g, '&quot;') : safeVal}" style="font-size:12px;font-family:${fieldDef.key.toLowerCase().includes('key') || fieldDef.key.toLowerCase().includes('id') ? 'monospace' : 'inherit'};">
        </div>`;
  }
}

const SAVEABLE_INPUT_TYPES = new Set(['text', 'number', 'select', 'color']);

function renderPaymentFeaturesHTML(config: MerchantConfig, expandedFeatures: Set<string>): string {
  return PAYMENT_FEATURE_CATEGORIES.map((category) => {
    const features = PAYMENT_FEATURES.filter((f) => f.category === category);
    return `
      <div style="margin-bottom:16px;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">${category}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${features
            .map((feature) => {
              const enabled = isFeatureEnabled(config, feature);
              const isExpanded = expandedFeatures.has(feature.key);
              const hasFields = feature.fields.length > 0;
              const hasSaveable = feature.fields.some((f) => SAVEABLE_INPUT_TYPES.has(f.inputType));
              return `
              <div style="border:1px solid ${enabled ? '#e2e8f0' : '#f1f5f9'};border-radius:8px;overflow:hidden;background:${enabled ? '#fff' : '#fafafa'};">
                <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;${hasFields ? 'cursor:pointer;' : ''}" ${hasFields ? `data-expand-feature="${feature.key}"` : ''}>
                  <label class="toggle-switch" style="flex-shrink:0;" onclick="event.stopPropagation()">
                    <input type="checkbox" class="pf-enable-toggle" data-feature-key="${feature.key}" ${enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${enabled ? '#0f172a' : '#94a3b8'};">${feature.label}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px;">${feature.description}</div>
                  </div>
                  ${enabled ? '<span class="badge" style="background:#dcfce7;color:#15803d;flex-shrink:0;">Active</span>' : ''}
                  ${hasFields ? `<span style="color:#94a3b8;font-size:12px;transform:${isExpanded ? 'rotate(180deg)' : 'rotate(0)'};transition:transform 0.2s;flex-shrink:0;">▾</span>` : ''}
                </div>
                ${
                  isExpanded && hasFields
                    ? `
                  <div data-feature-accordion="${feature.key}" style="border-top:1px solid #f1f5f9;padding:4px 14px 12px;">
                    ${feature.fields.map((f) => renderPaymentFeatureField(feature.key, f, config)).join('')}
                    ${
                      hasSaveable
                        ? `
                    <div data-save-row="${feature.key}" style="display:none;justify-content:flex-end;padding-top:12px;margin-top:4px;border-top:1px solid #f1f5f9;" onclick="event.stopPropagation()">
                      <button class="pf-save" data-feature-key="${feature.key}"
                        style="font-size:12px;font-weight:600;padding:7px 18px;background:#0f172a;color:white;border:none;border-radius:7px;cursor:pointer;">
                        Save
                      </button>
                    </div>`
                        : ''
                    }
                  </div>`
                    : ''
                }
              </div>`;
            })
            .join('')}
        </div>
      </div>`;
  }).join('');
}

function renderCheckoutMockup(config: MerchantConfig, selectedRoute: string): string {
  const primary = config.merchant.theme.primaryColor || '#1d4ed8';
  const pages = config.navigation.pages;
  const selectedPage = pages.find((p) => p.route === selectedRoute) ?? pages.find((p) => p.id === 'payment') ?? pages[0];

  // Breadcrumb — render pages in schema order, bold the selected one
  const breadcrumb = pages
    .map((p) =>
      p === selectedPage
        ? `<strong style="color:#111827">${p.title}</strong>`
        : `<span style="color:#6b7280">${p.title}</span>`
    )
    .join(' <span style="color:#d1d5db">—</span> ');

  // Integration detection
  const csIntg = config.integrations.find((i) => i.provider === 'Cybersource' && i.enabled);
  const ppIntg = config.integrations.find((i) => i.provider === 'PayPal' && i.enabled);
  const svIntg = config.integrations.find((i) => i.provider === 'GiftCard' && i.enabled);
  const hasGooglePay = !!csIntg?.settings?.paymentMethods?.GGL?.length;
  const hasApplePay = !!csIntg?.settings?.paymentMethods?.APL?.length;
  const ppFunding: any[] = ppIntg?.settings?.fundingSources ?? [];
  const hasPayPal = !!ppIntg;
  const hasPayLaterBtn = ppFunding.some((f) => f.source === 'paylater' && f.enabled !== false);
  const hasVenmo = ppFunding.some((f) => f.source === 'venmo' && f.enabled !== false);
  const hasExpressSection = hasGooglePay || hasApplePay || hasPayPal;

  // Component detection on selected page
  const comps = selectedPage?.components ?? [];
  const hasDonation = comps.some((c) => c.componentType === 'donation' && c.enabled);
  const hasInsurance = comps.some((c) => c.componentType === 'insurance' && c.enabled);
  const hasPayLaterComp = comps.some((c) => c.componentType === 'pay-later' && c.enabled);
  const hasPaymentSel = comps.some((c) => c.componentType === 'payment-method-selector' && c.enabled);

  // Donation amounts
  const donAmounts: number[] = comps.find((c) => c.componentType === 'donation')?.features?.amounts ?? [1, 2, 5];

  // Build left-column content
  const parts: string[] = [];

  if (hasDonation) {
    parts.push(`
      <div style="margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:3px">Make a donation</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:14px">Contribute to a supported initiative</div>
        <div style="width:100%;padding:11px 16px;border:1px solid #d1d5db;border-radius:999px;text-align:center;font-size:13px;color:#374151;margin-bottom:10px">Round up my purchase (+ $1.00)</div>
        <div style="display:flex;gap:8px">
          ${donAmounts
            .slice(0, 2)
            .map(
              (a) =>
                `<div style="flex:1;padding:10px 8px;border:1px solid #d1d5db;border-radius:999px;text-align:center;font-size:13px;color:#374151">$${Number(a).toFixed(2)}</div>`
            )
            .join('')}
          <div style="flex:1;padding:10px 8px;border:1px solid #d1d5db;border-radius:999px;text-align:center;font-size:13px;color:#374151">Custom</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">`);
  }

  if (hasInsurance) {
    parts.push(`
      <div style="margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:3px">Ticket Protection</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:12px">Protect your purchase with coverage for cancellations and delays.</div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
          <div style="width:18px;height:18px;border-radius:50%;border:2px solid #d1d5db;flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:#111827">Add ticket protection</div>
            <div style="font-size:12px;color:#6b7280">Coverage for cancellations, delays &amp; more</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:#111827">$2.99</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">`);
  }

  if (hasPayLaterComp) {
    parts.push(`
      <div style="margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:3px">Pay Monthly</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:12px">Split your purchase into easy monthly payments.</div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;background:#f9fafb">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">as low as</div>
          <div style="font-size:26px;font-weight:700;color:#111827">$3.00<span style="font-size:13px;font-weight:400;color:#6b7280"> /mo</span></div>
          <div style="font-size:12px;color:#9ca3af;margin-top:2px">for 3 months · 0% APR</div>
          <div style="margin-top:12px;padding:12px;border-radius:8px;background:${primary};text-align:center;font-size:13px;font-weight:600;color:white">Apply for financing</div>
        </div>
      </div>`);
  }

  if (hasPaymentSel) {
    if (hasExpressSection) {
      const exBtns: string[] = [];
      if (hasGooglePay)
        exBtns.push(`
        <div style="padding:13px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:6px">
          <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <span style="color:white;font-size:14px;font-weight:500">Pay</span>
        </div>`);
      if (hasApplePay)
        exBtns.push(`
        <div style="padding:13px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center">
          <svg width="42" height="17" viewBox="0 0 50 20" fill="white"><path d="M9.2 4.4c-.7.8-1.8 1.5-2.9 1.4-.1-1.1.4-2.3 1.1-3 .7-.8 1.9-1.5 2.9-1.5.1 1.2-.4 2.3-1.1 3.1zm1 1.6c-1.6-.1-3 .9-3.8.9-.8 0-2-.9-3.3-.9C1.5 6.1 0 7.5 0 10.4c0 4.1 3.6 9.6 5.1 9.6.8 0 1.5-.5 2.6-.5 1.1 0 1.7.5 2.7.5C12 20 15 15 15 10.4c0-2.8-1.5-4.4-3.8-4.4h-1z"/><text x="18" y="15" font-size="12" font-weight="700" font-family="Arial"> Pay</text></svg>
        </div>`);
      if (hasPayPal)
        exBtns.push(`
        <div style="padding:13px;background:#ffc439;border-radius:8px;display:flex;align-items:center;justify-content:center">
          <span style="font-size:14px;font-weight:800;color:#003087">Pay</span><span style="font-size:14px;font-weight:800;color:#009cde">Pal</span>
        </div>`);
      if (hasPayLaterBtn)
        exBtns.push(`
        <div style="padding:13px;background:#ffc439;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:6px">
          <div style="width:18px;height:18px;border-radius:50%;background:#003087;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white">P</div>
          <span style="font-size:13px;font-weight:700;color:#003087">Pay Later</span>
        </div>`);
      if (hasVenmo)
        exBtns.push(`
        <div style="padding:13px;background:#008cff;border-radius:8px;display:flex;align-items:center;justify-content:center">
          <span style="font-size:14px;font-weight:700;color:white;letter-spacing:0.02em">venmo</span>
        </div>`);

      // 2-column grid
      const rows: string[] = [];
      for (let i = 0; i < exBtns.length; i += 2) {
        const pair = exBtns.slice(i, i + 2);
        rows.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${pair.join('')}</div>`);
      }
      parts.push(`
        <div style="margin-bottom:16px">
          <div style="text-align:center;font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;margin-bottom:10px">EXPRESS PAYMENTS</div>
          <div style="display:flex;flex-direction:column;gap:8px">${rows.join('')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="flex:1;height:1px;background:#e5e7eb"></div>
          <span style="font-size:11px;color:#9ca3af;font-weight:500">OR</span>
          <div style="flex:1;height:1px;background:#e5e7eb"></div>
        </div>`);
    }

    parts.push(`
      <div style="margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:14px">Contact information</div>
        ${[
          ['First name', 'John'],
          ['Last name', 'Doe'],
          ['Email', 'johndoe@example.com'],
        ]
          .map(
            ([lbl, val]) => `
          <div style="border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;margin-bottom:8px">
            <div style="font-size:11px;color:#6b7280;margin-bottom:2px">${lbl}</div>
            <div style="font-size:14px;color:#111827">${val}</div>
          </div>`
          )
          .join('')}
        <div style="border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px">
          <div style="display:flex;align-items:center;gap:4px;border-right:1px solid #e5e7eb;padding-right:10px">
            <span style="font-size:15px">🇺🇸</span>
            <span style="font-size:13px;color:#374151">+1</span>
            <span style="font-size:9px;color:#9ca3af">▾</span>
          </div>
          <div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:2px">Phone Number</div>
            <div style="font-size:14px;color:#111827">5555555555</div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:20px">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px">Payment method</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style="font-size:12px;color:#6b7280">Transactions are secured and encrypted</span>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
          ${csIntg ? `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #f3f4f6"><span style="background:#1a1f71;color:white;font-size:8px;font-weight:700;border-radius:3px;padding:2px 5px;letter-spacing:0.02em">VISA</span><span style="font-size:14px;color:#111827">Credit / Debit Card</span></div>` : ''}
          ${svIntg ? `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid #f3f4f6"><span style="background:#2d7d46;color:white;font-size:8px;font-weight:700;border-radius:3px;padding:2px 5px">SVC</span><span style="font-size:14px;color:#111827">Gift Card</span></div>` : ''}
          ${hasPayPal ? `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px"><span style="font-size:13px;font-weight:800;color:#003087">Pay</span><span style="font-size:13px;font-weight:800;color:#009cde;margin-left:-5px">Pal</span><span style="font-size:14px;color:#111827;margin-left:4px">PayPal</span></div>` : ''}
        </div>
      </div>`);
  }

  const content = parts.length
    ? parts.join('')
    : `<div style="text-align:center;padding:60px 20px;color:#9ca3af;font-size:13px">No components enabled on this page</div>`;

  return `
    <div id="checkout-mockup" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#f5f5f7;height:80%;display:flex;flex-direction:column;pointer-events:none;user-select:none;">

      <!-- Nav bar -->
      <div style="background:white;border-bottom:1px solid #e5e7eb;padding:10px 20px;display:flex;align-items:center;gap:16px;flex-shrink:0">
        <div style="display:flex;gap:8px">
          <div style="width:34px;height:34px;border-radius:50%;background:${primary};display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <div style="width:34px;height:34px;border-radius:50%;background:${primary};display:flex;align-items:center;justify-content:center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </div>
        </div>
        <div style="flex:1;text-align:center;font-size:12px;color:#374151">${breadcrumb}</div>
        <div style="width:76px"></div>
      </div>

      <!-- Body -->
      <div style="flex:1;display:flex;overflow:hidden">

        <!-- Left: checkout content -->
        <div style="flex:1;overflow-y:auto;padding:28px 36px;background:white">${content}</div>

        <!-- Right: order summary -->
        <div style="width:240px;flex-shrink:0;border-left:1px solid #e5e7eb;padding:22px;background:white;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <div style="font-size:15px;font-weight:700;color:#111827">Order summary</div>
            <div style="position:relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:white;border-radius:50%;width:14px;height:14px;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center">2</span>
            </div>
          </div>
          ${[
            ['Subtotal', '$5.50'],
            ['Fee', '$2.00'],
            ['Taxes', '$1.50'],
          ]
            .map(
              ([lbl, val]) =>
                `<div style="display:flex;justify-content:space-between;font-size:13px;color:#374151;margin-bottom:10px"><span>${lbl}</span><span>${val}</span></div>`
            )
            .join('')}
          <div style="border-top:1px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;font-weight:700;color:#111827">Total</span>
            <span style="font-size:14px;font-weight:700;color:#111827">$9.00</span>
          </div>
        </div>

      </div>
    </div>`;
}

function renderOutputPanel(panelEl: HTMLElement, config: MerchantConfig, merchantId: string) {
  const original = originalConfigs[merchantId];
  const diffs = original ? buildDiff(original, config) : [];
  const versions = store.getVersions(merchantId);

  panelEl.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <!-- Tab bar -->
      <div class="tab-bar" style="padding: 0 16px; flex-shrink: 0; border-bottom: 1px solid #e8edf3;">
        ${(['json', 'preview', 'changes', 'history'] as OutputTab[])
          .map((tab) => {
            const labels: Record<OutputTab, string> = { json: 'JSON', preview: 'Preview', changes: 'Changes', history: 'History' };
            const badge =
              tab === 'changes' && diffs.length > 0
                ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:10px;font-size:10px;padding:1px 6px;margin-left:4px;">${diffs.length}</span>`
                : tab === 'history' && versions.length > 0
                  ? `<span style="background:#dbeafe;color:#1d4ed8;border-radius:10px;font-size:10px;padding:1px 6px;margin-left:4px;">${versions.length}</span>`
                  : '';
            return `<button class="tab ${activeOutputTab === tab ? 'active' : ''}" data-output-tab="${tab}">${labels[tab]}${badge}</button>`;
          })
          .join('')}
      </div>

      <!-- Tab content -->
      <div style="flex: 1; overflow: auto; padding: 16px;" id="output-tab-content">
        ${
          activeOutputTab === 'json'
            ? `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
            <button class="btn btn-ghost" id="copy-json-btn" style="font-size: 11px; padding: 4px 10px;">Copy JSON</button>
          </div>
          <pre style="
            font-family: 'Fira Code', 'Cascadia Code', 'SF Mono', Menlo, monospace;
            font-size: 11px; line-height: 1.6; color: #334155;
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
            padding: 16px; white-space: pre-wrap; word-break: break-word;
            overflow-wrap: break-word; margin: 0;
          ">${JSON.stringify(config, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        `
            : activeOutputTab === 'preview'
              ? `
          <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; display: flex; align-items: center; gap: 8px;
              background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
              <span style="width:18px;height:18px;border-radius:5px;flex-shrink:0;background:linear-gradient(135deg,${config.merchant.theme.primaryColor},${config.merchant.theme.secondaryColor})"></span>
              <span style="font-size:12px;font-weight:600;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${config.merchant.name}</span>
              <span style="font-size:10px;color:#94a3b8;font-family:monospace">${config.merchant.tenantId}</span>
            </div>
            <select class="form-input" id="preview-page-select" style="width:150px;font-size:12px;padding:5px 8px;">
              ${config.navigation.pages.map((p) => `<option value="${p.route}" ${p.route === previewPageRoute ? 'selected' : ''}>${p.title}</option>`).join('')}
            </select>
          </div>
          ${renderCheckoutMockup(config, previewPageRoute)}
        `
              : activeOutputTab === 'changes'
                ? `
          ${
            diffs.length === 0
              ? `
            <div style="text-align: center; padding: 48px 20px; color: #94a3b8; font-size: 13px;">
              <div style="font-size: 32px; margin-bottom: 10px;">✓</div>
              No changes from original config
            </div>
          `
              : `
            <div style="font-size: 11px; color: #64748b; margin-bottom: 12px; font-weight: 600;">${diffs.length} change${diffs.length !== 1 ? 's' : ''} from original</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${diffs
                .map(
                  (d) => `
                <div style="display: flex; align-items: flex-start; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 9px 12px;">
                  <span style="color: #d97706; font-size: 13px; flex-shrink: 0; margin-top: 1px;">~</span>
                  <span style="font-size: 11.5px; color: #78350f; line-height: 1.4;">${d}</span>
                </div>
              `
                )
                .join('')}
            </div>
          `
          }
        `
                : `
          <!-- History tab -->
          ${
            versions.length === 0
              ? `
            <div style="text-align: center; padding: 48px 20px; color: #94a3b8; font-size: 13px;">No version history yet. Publish a config to create a snapshot.</div>
          `
              : `
            <div style="font-size: 11px; color: #64748b; margin-bottom: 12px; font-weight: 600;">${versions.length} version${versions.length !== 1 ? 's' : ''}</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${[...versions]
                .reverse()
                .map(
                  (v) => `
                <div style="
                  background: ${v.isActive ? '#f0fdf4' : '#ffffff'};
                  border: 1.5px solid ${v.isActive ? '#86efac' : '#e2e8f0'};
                  border-radius: 8px; padding: 12px 14px;
                  display: flex; align-items: center; gap: 12px;
                ">
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.label}</span>
                      ${v.isActive ? '<span style="background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; border: 1px solid #86efac;">ACTIVE</span>' : ''}
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">
                      ${new Date(v.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  ${
                    !v.isActive
                      ? `
                    <button class="btn btn-ghost" data-rollback-id="${v.id}" style="font-size: 11px; padding: 5px 10px; flex-shrink: 0;">Restore</button>
                  `
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          `
          }
        `
        }
      </div>
    </div>
  `;

  // Tab switching
  panelEl.querySelectorAll<HTMLButtonElement>('button[data-output-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeOutputTab = btn.dataset.outputTab as OutputTab;
      renderOutputPanel(panelEl, config, merchantId);
    });
  });

  // Copy JSON
  panelEl.querySelector('#copy-json-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2)).catch(() => {});
  });

  // Page selector updates the mockup in place
  panelEl.querySelector<HTMLSelectElement>('#preview-page-select')?.addEventListener('change', (e) => {
    previewPageRoute = (e.target as HTMLSelectElement).value;
    const mockupEl = panelEl.querySelector<HTMLElement>('#checkout-mockup');
    if (mockupEl) mockupEl.outerHTML = renderCheckoutMockup(config, previewPageRoute);
  });

  // Rollback buttons in history tab
  panelEl.querySelectorAll<HTMLButtonElement>('[data-rollback-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.rollbackTo(merchantId, btn.dataset.rollbackId!);
    });
  });
}

export function renderAppConfig(container: HTMLElement): void {
  const expandedPages = new Set<string>();
  const expandedComponents = new Set<string>(); // key: `${pageId}-${compId}`
  const expandedFeatures = new Set<string>();
  // True while a config mutation is in flight — suppresses the page-enter fade animation
  // so toggles don't cause a visible flash on the full DOM rebuild.
  let suppressAnimation = false;

  function build() {
    const leftPanel = container.querySelector<HTMLElement>('#left-panel');
    const scrollTop = leftPanel?.scrollTop ?? 0;
    const state = store.getState();
    const { activeMerchantId, editingConfig, isDirty } = state;

    if (!activeMerchantId || !editingConfig) {
      container.innerHTML = `
        <div class="${suppressAnimation ? '' : 'page-enter'}" style="
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: calc(100vh - 60px); color: #94a3b8; text-align: center; padding: 40px;
        ">
          <div style="
            width: 72px; height: 72px; border-radius: 20px;
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            display: flex; align-items: center; justify-content: center;
            font-size: 30px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          ">⚙</div>
          <div style="font-size: 18px; font-weight: 800; color: #334155; margin-bottom: 8px;">No Merchant Selected</div>
          <div style="font-size: 14px; color: #94a3b8; margin-bottom: 28px; max-width: 320px; line-height: 1.6;">
            Choose a merchant from the Merchants page to start editing its configuration.
          </div>
          <button class="btn btn-primary" id="go-to-merchants-btn" style="padding: 10px 20px;">Go to Merchants →</button>
        </div>
      `;
      container.querySelector('#go-to-merchants-btn')?.addEventListener('click', () => navigate('#/merchants'));
      return;
    }

    // Seed original config for diff tracking
    if (!originalConfigs[activeMerchantId]) {
      const merchant = getMerchantById(activeMerchantId);
      if (merchant) originalConfigs[activeMerchantId] = deepClone(merchant.config);
    }

    // Ensure baseline version exists (silent, no notify)
    store.ensureBaselineVersion(activeMerchantId, editingConfig);

    // Default preview to the first enabled page
    if (!previewPageRoute || !editingConfig.navigation.pages.find((p) => p.route === previewPageRoute)) {
      previewPageRoute = editingConfig.navigation.pages[0]?.route ?? '';
    }

    const config = editingConfig;
    const merchantName = config.merchant.name;
    const theme = config.merchant.theme;
    const activeVersion = store.getActiveVersion(activeMerchantId);

    container.innerHTML = `
      <div class="${suppressAnimation ? '' : 'page-enter'}" style="display: flex; height: calc(100vh - 60px); overflow: hidden;">

        <!-- LEFT: Form Editor (60%) -->
        <div id="left-panel" style="flex: 0 0 60%; overflow-y: auto; border-right: 1px solid #e8edf3; padding: 24px 28px; background: #f8fafc;">

          <!-- Header -->
          <div style="
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 22px; padding: 14px 18px;
            background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            box-shadow: 0 1px 3px rgba(15,23,42,0.04);
          ">
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">App Configuration</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span>Editing <strong style="color: #475569; font-weight: 600;">${merchantName}</strong></span>
                ${isDirty ? '<span style="background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; border: 1px solid #fde68a;">UNSAVED</span>' : ''}
                ${activeVersion ? `<span style="font-size: 10px; color: #94a3b8;">${activeVersion.label}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: 12px;">
              <button class="btn btn-ghost" id="reset-btn" style="font-size: 12px; padding: 6px 12px;">Reset</button>
              <button class="btn btn-ghost" id="export-btn" style="font-size: 12px; padding: 6px 12px;">Export</button>
              <button class="btn btn-primary" id="publish-btn" style="font-size: 12px; padding: 6px 14px;" ${!isDirty && activeVersion ? 'disabled style="opacity: 0.5;"' : ''}>Publish</button>
            </div>
          </div>

          <!-- Section: Merchant Theme -->
          <div class="card" style="margin-bottom: 14px;">
            <div class="section-header"><span>Merchant Theme</span></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div>
                <label class="form-label">Primary Color</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="color" id="field-primary-color" value="${theme.primaryColor}" style="width: 38px; height: 34px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; padding: 2px;">
                  <input class="form-input" type="text" id="field-primary-color-hex" value="${theme.primaryColor}" style="flex: 1; font-family: monospace; font-size: 12px;" placeholder="#000000">
                </div>
              </div>
              <div>
                <label class="form-label">Secondary Color</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="color" id="field-secondary-color" value="${theme.secondaryColor}" style="width: 38px; height: 34px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; padding: 2px;">
                  <input class="form-input" type="text" id="field-secondary-color-hex" value="${theme.secondaryColor}" style="flex: 1; font-family: monospace; font-size: 12px;" placeholder="#000000">
                </div>
              </div>
              <div>
                <label class="form-label">Font Family</label>
                <select class="form-input" id="field-font-family">
                  ${['Roboto', 'Inter', 'Open Sans', 'system-ui'].map((f) => `<option value="${f}" ${theme.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label">Border Radius</label>
                <select class="form-input" id="field-border-radius">
                  ${['4px', '8px', '12px', '16px'].map((r) => `<option value="${r}" ${theme.borderRadius === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
              </div>
              <div style="grid-column: span 2;">
                <div style="height: 36px; border-radius: 8px; background: linear-gradient(90deg, ${theme.primaryColor} 50%, ${theme.secondaryColor} 50%); border: 1px solid #e2e8f0;" id="color-preview-bar"></div>
              </div>
              <div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: #374151; font-weight: 500;">Apply Layout Color</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="field-apply-layout-color" ${theme.applyLayoutColor === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Section: Feature Flags -->
          <div class="card" style="margin-bottom: 14px;">
            <div class="section-header"><span>Feature Flags</span></div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${config.featureFlags
                .map(
                  (flag: FeatureFlag) => `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
                  <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 600; color: #374151;">${flag.label}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${flag.description}</div>
                  </div>
                  <label class="toggle-switch" style="flex-shrink: 0; margin-top: 2px;">
                    <input type="checkbox" class="flag-toggle" data-flag-key="${flag.key}" ${flag.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Section: Navigation Pages -->
          <div class="card" style="margin-bottom: 14px;">
            <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;">
              <span>Navigation Pages</span>
              <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: #64748b;">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" class="nav-global-toggle" data-nav-key="allowSkip" ${config.navigation.allowSkip ? 'checked' : ''}>
                  <span>Allow Skip</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" class="nav-global-toggle" data-nav-key="showProgress" ${config.navigation.showProgress ? 'checked' : ''}>
                  <span>Show Progress</span>
                </label>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${ALL_PAGE_IDS.map((pageId) => {
                const page: PageConfig | undefined = config.navigation.pages.find((p: PageConfig) => p.id === pageId);
                const isEnabled = !!page;
                const isExpanded = isEnabled && expandedPages.has(pageId);
                const enabledComps = page ? page.components.filter((c) => c.enabled).length : 0;
                const pageTitle = page?.title ?? (pageId === 'pay-monthly' ? 'Pay Monthly' : pageId.charAt(0).toUpperCase() + pageId.slice(1));
                const pageRoute = page?.route ?? '/' + pageId;
                return `
                  <div style="border: 1px solid ${isEnabled ? '#e2e8f0' : '#f1f5f9'}; border-radius: 8px; overflow: hidden;">
                    <!-- Page header row -->
                    <div style="display: flex; align-items: center; gap: 10px; padding: 11px 14px; background: ${isEnabled ? '#f8fafc' : '#fafafa'}; cursor: ${isEnabled ? 'pointer' : 'default'};" ${isEnabled ? `data-expand-page="${pageId}"` : ''}>
                      <!-- Reorder (payment page is always last — no controls) -->
                      <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; width: 14px;">
                        ${
                          isEnabled && pageId !== 'payment'
                            ? `
                          <button class="page-order-btn" data-page-id="${pageId}" data-dir="up" style="background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 11px; padding: 0; line-height: 1; font-weight: 700;" onclick="event.stopPropagation()">▲</button>
                          <button class="page-order-btn" data-page-id="${pageId}" data-dir="down" style="background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 11px; padding: 0; line-height: 1; font-weight: 700;" onclick="event.stopPropagation()">▼</button>
                        `
                            : ''
                        }
                      </div>
                      <label class="toggle-switch" style="flex-shrink: 0;" onclick="event.stopPropagation()">
                        <input type="checkbox" class="page-toggle" data-page-id="${pageId}" ${isEnabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                      <div style="flex: 1;">
                        <div style="font-size: 13px; font-weight: 600; color: ${isEnabled ? '#0f172a' : '#94a3b8'};">${pageTitle}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${isEnabled ? `${pageRoute} · ${enabledComps}/${page!.components.length} components` : 'Not included in checkout flow'}</div>
                      </div>
                      ${isEnabled ? `<span style="font-size: 10px; color: #94a3b8; font-weight: 600;">order: ${page!.order}</span>` : ''}
                      ${isEnabled ? `<span style="color: #94a3b8; font-size: 12px; transform: ${isExpanded ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s; margin-left: 6px;">▾</span>` : ''}
                    </div>

                    <!-- Components accordion -->
                    ${
                      isExpanded
                        ? `
                      <div style="border-top: 1px solid #e2e8f0; background: #ffffff; padding: 8px 14px;">
                        ${page.components
                          .map((comp) => {
                            const compKey = `${page.id}-${comp.id}`;
                            const isCompExpanded = expandedComponents.has(compKey);
                            return `
                            <div style="border: 1px solid #f1f5f9; border-radius: 6px; margin-bottom: 6px; overflow: hidden;">
                              <!-- Component row -->
                              <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: ${comp.enabled ? '#ffffff' : '#fafafa'}; cursor: pointer;" data-expand-comp="${compKey}">
                                <div style="display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;">
                                  <button class="comp-order-btn" data-page-id="${page.id}" data-comp-id="${comp.id}" data-dir="up" style="background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 10px; padding: 0; line-height: 1;" onclick="event.stopPropagation()">▲</button>
                                  <button class="comp-order-btn" data-page-id="${page.id}" data-comp-id="${comp.id}" data-dir="down" style="background: none; border: none; cursor: pointer; color: #cbd5e1; font-size: 10px; padding: 0; line-height: 1;" onclick="event.stopPropagation()">▼</button>
                                </div>
                                <label class="toggle-switch" style="flex-shrink: 0; transform: scale(0.85); transform-origin: left;" onclick="event.stopPropagation()">
                                  <input type="checkbox" class="component-toggle" data-page-id="${page.id}" data-comp-id="${comp.id}" ${comp.enabled ? 'checked' : ''}>
                                  <span class="toggle-slider"></span>
                                </label>
                                <div style="flex: 1;">
                                  <span style="font-size: 12px; font-weight: 600; color: ${comp.enabled ? '#374151' : '#94a3b8'};">${comp.componentType}</span>
                                  <span style="font-size: 10px; color: #94a3b8; margin-left: 6px;">order: ${comp.order}</span>
                                </div>
                                <span style="font-size: 10px; font-family: monospace; color: #cbd5e1; margin-right: 4px;">${comp.id}</span>
                                <span style="color: #94a3b8; font-size: 11px; transform: ${isCompExpanded ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform 0.2s;">▾</span>
                              </div>
                              <!-- Component feature fields -->
                              ${isCompExpanded ? renderComponentFeatureFields(comp, page.id) : ''}
                            </div>
                          `;
                          })
                          .join('')}
                      </div>
                    `
                        : ''
                    }
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section: Payment Features -->
          <div class="card" style="margin-bottom: 14px;">
            <div class="section-header"><span>Payment Features</span></div>
            ${renderPaymentFeaturesHTML(config, expandedFeatures)}
          </div>

        </div>

        <!-- RIGHT: Output Panel (40%) -->
        <div style="flex: 0 0 40%; display: flex; flex-direction: column; overflow: hidden; background: #ffffff;" id="output-panel"></div>

      </div>
    `;

    // Render output panel
    const outputPanel = container.querySelector<HTMLElement>('#output-panel')!;
    renderOutputPanel(outputPanel, config, activeMerchantId);

    // ── Event handlers ──

    function updateConfig(mutate: (cfg: MerchantConfig) => void) {
      const current = deepClone(state.editingConfig!);
      mutate(current);
      suppressAnimation = true;
      store.setState({ editingConfig: current, isDirty: true });
      suppressAnimation = false;
      const panel = container.querySelector<HTMLElement>('#output-panel');
      if (panel) renderOutputPanel(panel, current, activeMerchantId!);
      const bar = container.querySelector<HTMLElement>('#color-preview-bar');
      if (bar) bar.style.background = `linear-gradient(90deg, ${current.merchant.theme.primaryColor} 50%, ${current.merchant.theme.secondaryColor} 50%)`;
    }

    // Theme
    container.querySelector<HTMLInputElement>('#field-primary-color')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      container.querySelector<HTMLInputElement>('#field-primary-color-hex')!.value = val;
      updateConfig((cfg) => {
        cfg.merchant.theme.primaryColor = val;
      });
    });
    container.querySelector<HTMLInputElement>('#field-primary-color-hex')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        container.querySelector<HTMLInputElement>('#field-primary-color')!.value = val;
        updateConfig((cfg) => {
          cfg.merchant.theme.primaryColor = val;
        });
      }
    });
    container.querySelector<HTMLInputElement>('#field-secondary-color')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      container.querySelector<HTMLInputElement>('#field-secondary-color-hex')!.value = val;
      updateConfig((cfg) => {
        cfg.merchant.theme.secondaryColor = val;
      });
    });
    container.querySelector<HTMLInputElement>('#field-secondary-color-hex')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        container.querySelector<HTMLInputElement>('#field-secondary-color')!.value = val;
        updateConfig((cfg) => {
          cfg.merchant.theme.secondaryColor = val;
        });
      }
    });
    container.querySelector<HTMLSelectElement>('#field-font-family')?.addEventListener('change', (e) => {
      e.stopPropagation();
      updateConfig((cfg) => {
        cfg.merchant.theme.fontFamily = (e.target as HTMLSelectElement).value;
      });
    });
    container.querySelector<HTMLSelectElement>('#field-border-radius')?.addEventListener('change', (e) => {
      e.stopPropagation();
      updateConfig((cfg) => {
        cfg.merchant.theme.borderRadius = (e.target as HTMLSelectElement).value;
      });
    });
    container.querySelector<HTMLInputElement>('#field-apply-layout-color')?.addEventListener('change', (e) => {
      e.stopPropagation();
      const val = (e.target as HTMLInputElement).checked ? 'true' : 'false';
      updateConfig((cfg) => {
        cfg.merchant.theme.applyLayoutColor = val;
      });
    });

    // Feature flags
    container.querySelectorAll<HTMLInputElement>('.flag-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const key = input.dataset.flagKey!;
        updateConfig((cfg) => {
          const flag = cfg.featureFlags.find((f) => f.key === key);
          if (flag) flag.enabled = input.checked;
        });
      });
    });

    // Global nav toggles (allowSkip, showProgress)
    container.querySelectorAll<HTMLInputElement>('.nav-global-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const key = input.dataset.navKey as 'allowSkip' | 'showProgress';
        updateConfig((cfg) => {
          cfg.navigation[key] = input.checked;
        });
      });
    });

    // Page expand/collapse
    container.querySelectorAll<HTMLElement>('[data-expand-page]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.toggle-switch, .page-order-btn')) return;
        const pageId = el.dataset.expandPage!;
        expandedPages.has(pageId) ? expandedPages.delete(pageId) : expandedPages.add(pageId);
        build();
      });
    });

    // Page toggles — toggling off removes the page from the array; toggling on re-inserts a default
    container.querySelectorAll<HTMLInputElement>('.page-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const pageId = input.dataset.pageId!;
        updateConfig((cfg) => {
          if (input.checked) {
            // Add back — only if not already present
            if (!cfg.navigation.pages.find((p) => p.id === pageId)) {
              const fresh = makeDefaultPage(pageId, cfg.merchant.id);
              cfg.navigation.pages.push(fresh);
              cfg.navigation.pages.sort((a, b) => (PAGE_ORDER[a.id] ?? 99) - (PAGE_ORDER[b.id] ?? 99));
            }
          } else {
            cfg.navigation.pages = cfg.navigation.pages.filter((p) => p.id !== pageId);
          }
        });
      });
    });

    // Page reorder
    container.querySelectorAll<HTMLButtonElement>('.page-order-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageId = btn.dataset.pageId!;
        const dir = btn.dataset.dir!;
        updateConfig((cfg) => {
          const pages = cfg.navigation.pages;
          const idx = pages.findIndex((p) => p.id === pageId);
          if (idx === -1 || pageId === 'payment') return;
          const swap = dir === 'up' ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= pages.length) return;
          // Payment is always last — can't swap with it
          if (pages[swap]?.id === 'payment') return;
          [pages[idx], pages[swap]] = [pages[swap], pages[idx]];
          pages.forEach((p, i) => {
            p.order = i + 1;
          });
          // Re-enforce: payment always last
          const payIdx = pages.findIndex((p) => p.id === 'payment');
          if (payIdx !== -1 && payIdx !== pages.length - 1) {
            const [pay] = pages.splice(payIdx, 1);
            pages.push(pay);
            pages.forEach((p, i) => {
              p.order = i + 1;
            });
          }
        });
        build();
      });
    });

    // Component expand/collapse
    container.querySelectorAll<HTMLElement>('[data-expand-comp]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.toggle-switch, .comp-order-btn')) return;
        const compKey = el.dataset.expandComp!;
        expandedComponents.has(compKey) ? expandedComponents.delete(compKey) : expandedComponents.add(compKey);
        build();
      });
    });

    // Component toggles
    container.querySelectorAll<HTMLInputElement>('.component-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const pageId = input.dataset.pageId!;
        const compId = input.dataset.compId!;
        updateConfig((cfg) => {
          const page = cfg.navigation.pages.find((p) => p.id === pageId);
          const comp = page?.components.find((c) => c.id === compId);
          if (comp) comp.enabled = input.checked;
        });
      });
    });

    // Component reorder
    container.querySelectorAll<HTMLButtonElement>('.comp-order-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageId = btn.dataset.pageId!;
        const compId = btn.dataset.compId!;
        const dir = btn.dataset.dir!;
        updateConfig((cfg) => {
          const page = cfg.navigation.pages.find((p) => p.id === pageId);
          if (!page) return;
          const idx = page.components.findIndex((c) => c.id === compId);
          if (idx === -1) return;
          const swap = dir === 'up' ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= page.components.length) return;
          [page.components[idx], page.components[swap]] = [page.components[swap], page.components[idx]];
          page.components.forEach((c, i) => {
            c.order = i + 1;
          });
        });
        build();
      });
    });

    // Feature flag toggles (in component feature sections)
    container.querySelectorAll<HTMLInputElement>('.feat-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const key = input.dataset.featKey!;
        // prefix is `feat-${compKey}` where compKey = `${pageId}-${comp.id}`
        const compKey = input.dataset.prefix!.replace(/^feat-/, '');
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                comp.features[key] = input.checked;
                return;
              }
            }
          }
        });
      });
    });

    // Feature number inputs
    container.querySelectorAll<HTMLInputElement>('.feature-number').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const compKey = input.dataset.compKey!;
        const featureKey = input.dataset.feature!;
        const val = parseFloat(input.value);
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                comp.features[featureKey] = isNaN(val) ? 0 : val;
                return;
              }
            }
          }
        });
      });
    });

    // Feature text inputs
    container.querySelectorAll<HTMLInputElement>('.feature-text').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const compKey = input.dataset.compKey!;
        const featureKey = input.dataset.feature!;
        const val = input.value;
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                comp.features[featureKey] = val;
                return;
              }
            }
          }
        });
      });
    });

    // Amounts pill remove
    container.querySelectorAll<HTMLButtonElement>('[data-remove-amount]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const amount = parseFloat(btn.dataset.removeAmount!);
        const compKey = btn.dataset.compKey!;
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                comp.features.amounts = (comp.features.amounts as number[]).filter((a) => a !== amount);
                return;
              }
            }
          }
        });
        build();
      });
    });

    // Amounts add button
    container.querySelectorAll<HTMLButtonElement>('[data-add-amount-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const compKey = btn.dataset.compKey!;
        const input = container.querySelector<HTMLInputElement>(`#add-amount-${compKey}`);
        const val = parseFloat(input?.value ?? '');
        if (!isNaN(val) && val > 0) {
          updateConfig((cfg) => {
            for (const page of cfg.navigation.pages) {
              for (const comp of page.components) {
                if (`${page.id}-${comp.id}` === compKey) {
                  const amounts: number[] = comp.features.amounts ?? [];
                  if (!amounts.includes(val)) amounts.push(val);
                  amounts.sort((a, b) => a - b);
                  comp.features.amounts = amounts;
                  return;
                }
              }
            }
          });
          build();
        }
      });
    });

    // Style overrides (color picker)
    container.querySelectorAll<HTMLInputElement>('.style-override-color').forEach((input) => {
      input.addEventListener('input', () => {
        const compKey = input.dataset.compKey!;
        const overrideKey = input.dataset.override!;
        const val = input.value;
        const textInput = container.querySelector<HTMLInputElement>(`.style-override[data-comp-key="${compKey}"][data-override="${overrideKey}"]`);
        if (textInput) textInput.value = val;
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                if (!comp.styleOverrides) comp.styleOverrides = {};
                comp.styleOverrides[overrideKey] = val;
                return;
              }
            }
          }
        });
      });
    });

    // Style overrides (text input)
    container.querySelectorAll<HTMLInputElement>('.style-override').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const compKey = input.dataset.compKey!;
        const overrideKey = input.dataset.override!;
        const val = input.value.trim();
        updateConfig((cfg) => {
          for (const page of cfg.navigation.pages) {
            for (const comp of page.components) {
              if (`${page.id}-${comp.id}` === compKey) {
                if (!comp.styleOverrides) comp.styleOverrides = {};
                comp.styleOverrides[overrideKey] = val;
                return;
              }
            }
          }
        });
      });
    });

    // ── Payment Feature handlers ─────────────────────────────────────────────

    // Feature expand/collapse
    container.querySelectorAll<HTMLElement>('[data-expand-feature]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.toggle-switch')) return;
        const key = el.dataset.expandFeature!;
        expandedFeatures.has(key) ? expandedFeatures.delete(key) : expandedFeatures.add(key);
        build();
      });
    });

    // Feature enable/disable toggle
    container.querySelectorAll<HTMLInputElement>('.pf-enable-toggle').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const featureKey = input.dataset.featureKey!;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        if (!def) return;
        updateConfig((cfg) => {
          toggleFeature(cfg, def, input.checked);
        });
      });
    });

    // Boolean field
    container.querySelectorAll<HTMLInputElement>('.pf-bool').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const featureKey = input.dataset.featureKey!;
        const fieldKey = input.dataset.fieldKey!;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        const fieldDef = def?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef) return;
        updateConfig((cfg) => setFieldValue(cfg, fieldDef.source, input.checked));
      });
    });

    // Number field
    container.querySelectorAll<HTMLInputElement>('.pf-number').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const featureKey = input.dataset.featureKey!;
        const fieldKey = input.dataset.fieldKey!;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        const fieldDef = def?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef) return;
        const val = parseFloat(input.value);
        if (!isNaN(val)) updateConfig((cfg) => setFieldValue(cfg, fieldDef.source, val));
      });
    });

    // Dirty-check helper — shows/hides the save row when saveable inputs change
    function checkFeatureDirty(featureKey: string): void {
      const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
      if (!def) return;
      const accordion = container.querySelector(`[data-feature-accordion="${featureKey}"]`);
      const saveRow = accordion?.querySelector<HTMLElement>(`[data-save-row="${featureKey}"]`);
      if (!accordion || !saveRow) return;
      const cfg = store.getState().editingConfig!;
      const dirty = def.fields.some((fieldDef) => {
        if (!SAVEABLE_INPUT_TYPES.has(fieldDef.inputType)) return false;
        const el = accordion.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-feature-key="${featureKey}"][data-field-key="${fieldDef.key}"]`);
        if (!el) return false;
        const stored = getFieldValue(cfg, fieldDef.source) ?? fieldDef.defaultValue ?? '';
        if (fieldDef.inputType === 'number') {
          return parseFloat(el.value) !== Number(stored);
        }
        return el.value !== String(stored);
      });
      saveRow.style.display = dirty ? 'flex' : 'none';
    }

    // Saveable field input — show save button when value diverges from stored config
    container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.pf-text, .pf-number, .pf-select, .pf-color').forEach((el) => {
      const featureKey = (el as HTMLElement).dataset.featureKey!;
      el.addEventListener('input', () => checkFeatureDirty(featureKey));
      el.addEventListener('change', () => checkFeatureDirty(featureKey));
    });

    // Save button — commits all saveable fields in the accordion; DOM rebuild hides the button naturally
    container.querySelectorAll<HTMLButtonElement>('.pf-save').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const featureKey = btn.dataset.featureKey!;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        if (!def) return;
        const accordion = container.querySelector(`[data-feature-accordion="${featureKey}"]`);
        if (!accordion) return;
        updateConfig((cfg) => {
          for (const fieldDef of def.fields) {
            if (!SAVEABLE_INPUT_TYPES.has(fieldDef.inputType)) continue;
            const el = accordion.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-feature-key="${featureKey}"][data-field-key="${fieldDef.key}"]`);
            if (!el) continue;
            const raw = el.value;
            const value = fieldDef.inputType === 'number' ? parseFloat(raw) : raw;
            if (fieldDef.inputType === 'number' && isNaN(value as number)) continue;
            setFieldValue(cfg, fieldDef.source, value);
          }
        });
      });
    });

    // Number-array: remove
    container.querySelectorAll<HTMLButtonElement>('.pf-amount-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const featureKey = btn.dataset.featureKey!;
        const fieldKey = btn.dataset.fieldKey!;
        const idx = parseInt(btn.dataset.index!, 10);
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        const fieldDef = def?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef) return;
        updateConfig((cfg) => {
          const arr: number[] = [...(getFieldValue(cfg, fieldDef.source) ?? [])];
          arr.splice(idx, 1);
          setFieldValue(cfg, fieldDef.source, arr);
        });
        build();
      });
    });

    // Number-array: add
    container.querySelectorAll<HTMLButtonElement>('.pf-amount-add').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const featureKey = btn.dataset.featureKey!;
        const fieldKey = btn.dataset.fieldKey!;
        const amtInput = container.querySelector<HTMLInputElement>(`.pf-amount-input[data-feature-key="${featureKey}"][data-field-key="${fieldKey}"]`);
        if (!amtInput) return;
        const val = parseFloat(amtInput.value);
        if (isNaN(val)) return;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        const fieldDef = def?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef) return;
        updateConfig((cfg) => {
          const arr: number[] = [...(getFieldValue(cfg, fieldDef.source) ?? [])];
          if (!arr.includes(val)) {
            arr.push(val);
            arr.sort((a, b) => a - b);
          }
          setFieldValue(cfg, fieldDef.source, arr);
        });
        amtInput.value = '';
        build();
      });
    });

    // 3DS card toggle
    container.querySelectorAll<HTMLInputElement>('.pf-card-3ds').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const provider = input.dataset.provider!;
        const group = input.dataset.group!;
        const brand = input.dataset.brand!;
        updateConfig((cfg) => {
          const intg = cfg.integrations.find((i) => i.provider === provider);
          if (!intg?.settings?.paymentMethods?.[group]) return;
          const card = intg.settings.paymentMethods[group].find((c: any) => c.cardBrandCode === brand);
          if (card) card.enabled3ds = input.checked;
        });
      });
    });

    // Funding source toggle
    container.querySelectorAll<HTMLInputElement>('.pf-funding-source').forEach((input) => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const featureKey = input.dataset.featureKey!;
        const fieldKey = input.dataset.fieldKey!;
        const source = input.dataset.source!;
        const def = PAYMENT_FEATURES.find((f) => f.key === featureKey);
        const fieldDef = def?.fields.find((f) => f.key === fieldKey);
        if (!fieldDef) return;
        updateConfig((cfg) => {
          const sources: any[] = [...(getFieldValue(cfg, fieldDef.source) ?? [])];
          if (input.checked) {
            if (!sources.some((s) => s.source === source)) sources.push({ source, enabled: true });
          } else {
            const idx = sources.findIndex((s) => s.source === source);
            if (idx >= 0) sources.splice(idx, 1);
          }
          setFieldValue(cfg, fieldDef.source, sources);
        });
      });
    });

    // Header action buttons
    container.querySelector('#publish-btn')?.addEventListener('click', () => {
      store.publishConfig(activeMerchantId!);
      activeOutputTab = 'history';
      build();
    });

    container.querySelector('#reset-btn')?.addEventListener('click', () => {
      const original = originalConfigs[activeMerchantId!];
      if (original) store.setState({ editingConfig: deepClone(original), isDirty: false });
    });

    container.querySelector('#export-btn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-${activeMerchantId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Restore scroll after DOM rebuild (handles expand/collapse, reorder)
    requestAnimationFrame(() => {
      const restoredPanel = container.querySelector<HTMLElement>('#left-panel');
      if (restoredPanel) restoredPanel.scrollTop = scrollTop;
    });
  }

  build();

  const unsub = store.subscribe(() => {
    build();
  });
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      unsub();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
