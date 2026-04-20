import { MOCK_MERCHANTS, getMerchantsForTenant, getMerchantById, getTenantsForStack, getStackById } from '../data/mock';
import { getMerchantVersionSummary, releaseVersionToNginxPath } from '../data/mockNginxLogs';
import { SCHEMA_RELEASES } from '../data/releases';
import { store } from '../services/store';
import { navigate } from '../router';
import { createMerchant } from '../services/api';

type ViewMode = 'grid' | 'matrix';

export function renderMerchants(container: HTMLElement): void {
  let viewMode: ViewMode = 'grid';
  let showCreateModal = false;

  function build() {
    const state = store.getState();
    const { activeStackId, activeTenantId, activeMerchantId } = state;
    const activeStack = getStackById(activeStackId);
    const stackTenants = getTenantsForStack(activeStackId);


    function versionColor(v: string): string {
      if (v >= '1.3') return '#15803d';
      if (v >= '1.2') return '#2563eb';
      if (v >= '1.1') return '#d97706';
      return '#94a3b8';
    }

    // Total matrix columns: merchant + version + 2 pages + 5 payment methods + 2 security = 11
    const MATRIX_COLS = 11;

    // Scope to active tenant or show all
    const displayTenants = activeTenantId === 'all'
      ? stackTenants
      : stackTenants.filter((t) => t.id === activeTenantId);
    const displayMerchantCount = displayTenants.reduce(
      (s, t) => s + getMerchantsForTenant(t.id).length, 0
    );
    const activeTenantName = activeTenantId === 'all'
      ? 'All Tenants'
      : (stackTenants.find((t) => t.id === activeTenantId)?.name ?? activeTenantId);

    // Look up a SchemaRelease by its nginx path version (e.g. '1.3' → release '1.3.0')
    const getReleaseForVersion = (nixVer: string) =>
      SCHEMA_RELEASES.find((r) => releaseVersionToNginxPath(r.version) === nixVer);

    // Matrix cell helpers — defined outside the template to avoid nested backtick issues
    const mxOn = (color: string, title: string) =>
      '<span title="' + title + '" style="color:' + color + ';font-size:15px;line-height:1;cursor:default;">✓</span>';
    const mxOff = () => '<span style="color:#e2e8f0;font-size:14px;">–</span>';

    const mxVersion = (ver: string) => {
      const c = versionColor(ver);
      const release = getReleaseForVersion(ver);
      const tooltip = release ? 'v' + release.version + ' — ' + release.title : 'v' + ver;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'
        + '<span title="' + tooltip + '" style="font-size:10px;font-family:monospace;font-weight:700;color:' + c + ';background:' + c + '18;padding:2px 7px;border-radius:99px;border:1px solid ' + c + '33;cursor:default;">v' + ver + '</span>'
        + (release ? '<span style="font-size:9px;color:#94a3b8;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;" title="' + release.title + '">' + release.title + '</span>' : '')
        + '</div>';
    };

    container.innerHTML = `
      <div class="page-enter" style="padding: 28px 32px; max-width: 1440px;">

        <!-- Page header -->
        <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Merchants</h1>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 5px; font-weight: 500;">
              ${activeStack?.name ?? activeStackId} &nbsp;·&nbsp; ${activeTenantName} &nbsp;·&nbsp; Select a merchant to configure.
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <!-- View toggle -->
            <div style="display: flex; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <button id="view-grid-btn" style="
                padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
                border: none; font-family: inherit;
                background: ${viewMode === 'grid' ? '#0f172a' : 'white'};
                color: ${viewMode === 'grid' ? 'white' : '#64748b'};
              ">Grid</button>
              <button id="view-matrix-btn" style="
                padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
                border: none; font-family: inherit;
                background: ${viewMode === 'matrix' ? '#0f172a' : 'white'};
                color: ${viewMode === 'matrix' ? 'white' : '#64748b'};
              ">Matrix</button>
            </div>
            <button class="btn btn-primary" id="create-merchant-btn" style="font-size: 12px; padding: 7px 16px;">+ New Merchant</button>
          </div>
        </div>

        ${viewMode === 'grid' ? `
          <!-- Stack header bar -->
          <div style="
            background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 12px 20px; margin-bottom: 22px;
            display: flex; align-items: center; gap: 14px;
          ">
            <div style="
              display: flex; align-items: center; gap: 8px;
              background: ${activeStack?.type === 'dedicated' ? '#f5f3ff' : '#eff6ff'};
              border: 1px solid ${activeStack?.type === 'dedicated' ? '#ddd6fe' : '#bfdbfe'};
              border-radius: 8px; padding: 6px 14px;
            ">
              <div style="
                width: 8px; height: 8px; border-radius: 50%;
                background: ${activeStack?.type === 'dedicated' ? '#8b5cf6' : '#3b82f6'};
              "></div>
              <span style="font-size: 13px; font-weight: 800; color: ${activeStack?.type === 'dedicated' ? '#6d28d9' : '#1d4ed8'}; letter-spacing: -0.2px;">${activeStack?.name ?? activeStackId}</span>
              <span style="font-size: 11px; font-weight: 600; color: ${activeStack?.type === 'dedicated' ? '#8b5cf6' : '#3b82f6'};">${activeStack?.type === 'dedicated' ? 'Dedicated' : 'Shared'}</span>
            </div>
            <span style="font-size: 12px; color: #94a3b8;">${activeStack?.description ?? ''}</span>
            <div style="flex: 1;"></div>
            <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">${displayTenants.length} tenant${displayTenants.length !== 1 ? 's' : ''}</span>
            <span style="color: #e2e8f0; font-size: 14px;">·</span>
            <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">${displayMerchantCount} merchant${displayMerchantCount !== 1 ? 's' : ''}</span>
          </div>

          <!-- Tenant sections with merchant cards -->
          <div style="display: flex; flex-direction: column; gap: 28px;">
            ${displayTenants.map(tenant => {
              const tenantMerchants = getMerchantsForTenant(tenant.id);
              const planColors: Record<string, string> = { enterprise: '#7c3aed', pro: '#0891b2', starter: '#64748b' };
              return `
                <!-- Tenant section -->
                <div>
                  <div style="
                    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
                    padding-bottom: 10px; border-bottom: 1.5px solid #f1f5f9;
                  ">
                    <span style="font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">${tenant.name}</span>
                    <span class="badge" style="background: ${planColors[tenant.plan]}18; color: ${planColors[tenant.plan]}; font-size: 10px;">${tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}</span>
                    <span style="font-size: 11px; color: #94a3b8;">${tenant.region}</span>
                    <span style="font-size: 11px; color: #cbd5e1; font-family: monospace;">${tenant.id}</span>
                    <div style="flex: 1;"></div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${tenantMerchants.length} merchant${tenantMerchants.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    ${tenantMerchants.map(m => {
                      const enabledPages = m.config.navigation.pages.filter(p => p.enabled).length;
                      const activeIntegrations = m.config.integrations.filter(i => i.enabled).length;
                      const isSelected = m.id === activeMerchantId;
                      const isDirtyThis = isSelected && state.isDirty;
                      const activeVersion = store.getActiveVersion(m.id);
                      const statusBadge = m.status === 'active' ? 'badge-active' : m.status === 'pending' ? 'badge-pending' : 'badge-inactive';
                      const liveSummary = getMerchantVersionSummary(m.id)[0] ?? null;
                      const liveVersion = liveSummary?.version ?? null;
                      const liveIsActive = liveSummary ? (Date.now() - new Date(liveSummary.lastSeen).getTime()) / 86400000 <= 7 : false;
                      const liveRelease = liveVersion ? getReleaseForVersion(liveVersion) : null;

                      return `
                        <div data-merchant-id="${m.id}" style="
                          background: white;
                          border: ${isSelected ? '2px solid #3b82f6' : '1.5px solid #e2e8f0'};
                          border-radius: 14px; padding: 20px; position: relative; cursor: pointer;
                          transition: transform 0.18s ease, box-shadow 0.18s ease;
                          ${isSelected ? 'box-shadow: 0 0 0 4px rgba(59,130,246,0.12), 0 4px 20px rgba(59,130,246,0.1);' : 'box-shadow: 0 1px 3px rgba(15,23,42,0.04);'}
                        "
                        onmouseover="if(!this.dataset.selected){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(15,23,42,0.1)';}"
                        onmouseout="if(!this.dataset.selected){this.style.transform='';this.style.boxShadow='0 1px 3px rgba(15,23,42,0.04)';}"
                        ${isSelected ? 'data-selected="true"' : ''}
                        >
                          ${isSelected ? `<div style="position:absolute;top:14px;right:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;font-size:9.5px;font-weight:700;letter-spacing:0.06em;padding:3px 9px;border-radius:99px;box-shadow:0 2px 8px rgba(59,130,246,0.35);">SELECTED</div>` : ''}

                          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                            <div style="width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, ${m.config.merchant.theme.primaryColor}, ${m.config.merchant.theme.secondaryColor}); box-shadow: 0 4px 14px rgba(0,0,0,0.15);"></div>
                            <div style="min-width: 0;">
                              <div style="font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</div>
                              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 3px; font-family: monospace;">${m.id}</div>
                            </div>
                          </div>

                          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
                            <span class="badge ${statusBadge}">${m.status.charAt(0).toUpperCase() + m.status.slice(1)}</span>
                            ${isDirtyThis ? '<span style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid #fde68a;">DRAFT</span>' : ''}
                            ${liveVersion
                              ? '<span style="font-size:10px;font-family:monospace;font-weight:700;padding:2px 7px;border-radius:99px;border:1px solid '
                                + (liveIsActive ? '#86efac;background:#dcfce7;color:#15803d' : '#e2e8f0;background:#f1f5f9;color:#64748b')
                                + '">v' + liveVersion + '</span>'
                                + (liveRelease ? '<span style="font-size:11px;color:#64748b;font-weight:500">' + liveRelease.title + '</span>' : '')
                              : '<span style="font-size:10px;color:#cbd5e1;font-style:italic">no traffic</span>'}
                            ${activeVersion ? `<span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${activeVersion.label}</span>` : ''}
                          </div>

                          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                            ${[
                              { v: enabledPages, l: 'Pages' },
                              { v: activeIntegrations, l: 'Integrations' },
                              { v: m.config.featureFlags.filter(f => f.enabled).length, l: 'Flags' },
                            ].map(s => `
                              <div style="text-align: center; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 9px; padding: 9px 6px;">
                                <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${s.v}</div>
                                <div style="font-size: 10px; color: #94a3b8; font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em;">${s.l}</div>
                              </div>
                            `).join('')}
                          </div>

                          <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 11px; color: #cbd5e1; font-weight: 500;">
                              Updated ${new Date(m.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <button class="btn btn-primary" data-select-merchant="${m.id}" style="font-size: 12px; padding: 6px 14px;">
                              ${isSelected ? '✓ Selected' : 'Configure →'}
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- Matrix view -->
          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="overflow-x: auto;">
              <table class="data-table" style="min-width: 100%; white-space: nowrap;">
                <thead>
                  <!-- Group headers -->
                  <tr style="border-bottom: none;">
                    <th style="width: 220px; padding: 10px 16px 0; border-bottom: none;"></th>
                    <th style="padding: 10px 8px 0; border-bottom: none;"></th>
                    <th colspan="2" style="text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; background: #f0fdf4; padding: 6px 8px 0; border-bottom: none; border-left: 1px solid #e2e8f0;">Pages</th>
                    <th colspan="5" style="text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; background: #eff6ff; padding: 6px 8px 0; border-bottom: none; border-left: 1px solid #e2e8f0;">Payment Methods</th>
                    <th colspan="2" style="text-align: center; font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; background: #faf5ff; padding: 6px 8px 0; border-bottom: none; border-left: 1px solid #e2e8f0;">Security</th>
                  </tr>
                  <!-- Column headers -->
                  <tr>
                    <th style="padding: 4px 16px 10px; text-align: left; border-bottom: 2px solid #e2e8f0;"></th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0;">Version</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #f0fdf4; border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">Insurance</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #f0fdf4; border-bottom: 2px solid #e2e8f0;">Pay Monthly</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #eff6ff; border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">Apple Pay</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #eff6ff; border-bottom: 2px solid #e2e8f0;">Google Pay</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #eff6ff; border-bottom: 2px solid #e2e8f0;">PayPal</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #eff6ff; border-bottom: 2px solid #e2e8f0;">Gift Card</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #eff6ff; border-bottom: 2px solid #e2e8f0;">Pay Later</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #faf5ff; border-bottom: 2px solid #e2e8f0; border-left: 1px solid #e2e8f0;">3DS</th>
                    <th style="padding: 4px 10px 10px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; background: #faf5ff; border-bottom: 2px solid #e2e8f0;">Accertify</th>
                  </tr>
                </thead>
                <tbody>
                  ${displayTenants.map(tenant => {
                    const tenantMerchants = getMerchantsForTenant(tenant.id);
                    return `
                      <tr>
                        <td colspan="${MATRIX_COLS}" style="
                          padding: 7px 16px; background: #f8fafc;
                          font-size: 10px; font-weight: 700; color: #64748b;
                          letter-spacing: 0.06em; text-transform: uppercase;
                          border-top: 2px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
                        ">${tenant.name}</td>
                      </tr>
                      ${tenantMerchants.map((m, rowIdx) => {
                        const isSelected = m.id === activeMerchantId;
                        const rowBg = isSelected ? '#eff6ff' : rowIdx % 2 === 0 ? '#ffffff' : '#fafafa';

                        const cfg          = m.config;
                        const hasInsurance  = cfg.navigation.pages.find(p => p.id === 'insurance')?.enabled ?? false;
                        const hasPayMonthly = cfg.navigation.pages.find(p => p.id === 'pay-monthly')?.enabled ?? false;
                        const csIntg        = cfg.integrations.find(i => i.provider === 'Cybersource' && i.enabled);
                        const hasAPL        = !!(csIntg?.settings?.paymentMethods?.APL?.length);
                        const hasGGL        = !!(csIntg?.settings?.paymentMethods?.GGL?.length);
                        const hasPPA        = cfg.applicationConfigs.some(r => r.name === 'paypal');
                        const hasSVC        = cfg.integrations.some(i => i.provider === 'StoredValue' && i.enabled);
                        const hasUPL        = cfg.applicationConfigs.some(r => r.name === 'uplift');
                        const has3DS        = cfg.featureFlags.find(f => f.key === 'enable3ds')?.enabled ?? false;
                        const hasAccertify  = cfg.integrations.some(i => i.provider === 'Accertify' && i.enabled);

                        const cell = (bg: string, extra = '') =>
                          'style="text-align:center;padding:10px;background:' + bg + ';' + extra + '"';

                        return [
                          '<tr data-matrix-merchant="' + m.id + '" style="cursor:pointer;background:' + rowBg + ';' + (isSelected ? 'outline:2px solid #3b82f6;outline-offset:-2px;' : '') + '">',
                          '<td style="padding:10px 16px;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:28px;height:28px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,' + cfg.merchant.theme.primaryColor + ',' + cfg.merchant.theme.secondaryColor + ');"></div><div><div style="font-size:13px;font-weight:600;color:#0f172a;">' + m.name + '</div><div style="font-size:10px;font-family:monospace;color:#94a3b8;">' + m.id + '</div></div></div></td>',
                          '<td ' + cell(rowBg) + '>' + mxVersion(releaseVersionToNginxPath(cfg.version)) + '</td>',
                          '<td ' + cell(rowBg, 'border-left:1px solid #f1f5f9;') + '>' + (hasInsurance  ? mxOn('#15803d', 'Insurance page enabled')  : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasPayMonthly ? mxOn('#15803d', 'Pay Monthly page enabled') : mxOff()) + '</td>',
                          '<td ' + cell(rowBg, 'border-left:1px solid #f1f5f9;') + '>' + (hasAPL ? mxOn('#374151', 'Apple Pay')               : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasGGL ? mxOn('#4285f4', 'Google Pay')              : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasPPA ? mxOn('#003087', 'PayPal')                  : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasSVC ? mxOn('#10b981', 'Stored Value / Gift Card') : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasUPL ? mxOn('#8b5cf6', 'Uplift / Pay Later')       : mxOff()) + '</td>',
                          '<td ' + cell(rowBg, 'border-left:1px solid #f1f5f9;') + '>' + (has3DS      ? mxOn('#7c3aed', '3DS authentication') : mxOff()) + '</td>',
                          '<td ' + cell(rowBg) + '>'                              + (hasAccertify ? mxOn('#7c3aed', 'Accertify fraud detection') : mxOff()) + '</td>',
                          '</tr>',
                        ].join('');
                      }).join('')}
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}

      </div>

      <!-- Create Merchant Modal -->
      ${showCreateModal ? `
        <div id="create-modal-overlay" style="
          position: fixed; inset: 0; background: rgba(15,23,42,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          backdrop-filter: blur(2px);
        ">
          <div style="
            background: white; border-radius: 16px; padding: 28px 32px;
            width: 480px; max-width: calc(100vw - 48px);
            box-shadow: 0 25px 60px rgba(15,23,42,0.2);
          ">
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.3px;">New Merchant</div>
            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 24px;">Create a new merchant with a default config.</div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div>
                <label class="form-label">Merchant Name</label>
                <input class="form-input" type="text" id="new-merchant-name" placeholder="e.g. Apollo Ventures" autofocus>
              </div>
              <div>
                <label class="form-label">Merchant ID</label>
                <input class="form-input" type="text" id="new-merchant-id" placeholder="e.g. apl_001" style="font-family: monospace;">
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Must be unique across all tenants.</div>
              </div>
              <div>
                <label class="form-label">Tenant</label>
                <select class="form-input" id="new-merchant-tenant">
                  ${stackTenants.map((t, ti) => `<option value="${t.id}" ${(activeTenantId !== 'all' ? t.id === activeTenantId : ti === 0) ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="create-error" style="margin-top: 12px; font-size: 12px; color: #b91c1c; display: none;"></div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 28px;">
              <button class="btn btn-ghost" id="cancel-create-btn" style="padding: 9px 18px;">Cancel</button>
              <button class="btn btn-primary" id="confirm-create-btn" style="padding: 9px 18px;">Create Merchant</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    // View toggle
    container.querySelector('#view-grid-btn')?.addEventListener('click', () => { viewMode = 'grid'; build(); });
    container.querySelector('#view-matrix-btn')?.addEventListener('click', () => { viewMode = 'matrix'; build(); });

    // New merchant button
    container.querySelector('#create-merchant-btn')?.addEventListener('click', () => { showCreateModal = true; build(); });

    // Merchant card clicks (grid view)
    container.querySelectorAll<HTMLElement>('[data-merchant-id]').forEach(card => {
      card.addEventListener('click', e => {
        if ((e.target as HTMLElement).closest('[data-select-merchant]')) return;
        const merchantId = card.dataset.merchantId!;
        const merchant = getMerchantById(merchantId)!;
        store.setState({ activeTenantId: merchant.tenantId, activeMerchantId: merchantId, editingConfig: JSON.parse(JSON.stringify(merchant.config)), isDirty: false });
      });
    });

    // Configure buttons (grid view)
    container.querySelectorAll<HTMLButtonElement>('[data-select-merchant]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const merchantId = btn.dataset.selectMerchant!;
        const merchant = getMerchantById(merchantId)!;
        store.setState({ activeTenantId: merchant.tenantId, activeMerchantId: merchantId, editingConfig: JSON.parse(JSON.stringify(merchant.config)), isDirty: false });
        navigate('#/app-config');
      });
    });

    // Matrix row clicks
    container.querySelectorAll<HTMLElement>('[data-matrix-merchant]').forEach(row => {
      row.addEventListener('click', () => {
        const merchantId = row.dataset.matrixMerchant!;
        const merchant = getMerchantById(merchantId)!;
        store.setState({
          activeTenantId: merchant.tenantId,
          activeMerchantId: merchantId,
          editingConfig: JSON.parse(JSON.stringify(merchant.config)),
          isDirty: false,
        });
        navigate('#/app-config');
      });
    });

    // Modal cancel
    container.querySelector('#cancel-create-btn')?.addEventListener('click', () => { showCreateModal = false; build(); });
    container.querySelector('#create-modal-overlay')?.addEventListener('click', e => {
      if ((e.target as HTMLElement).id === 'create-modal-overlay') { showCreateModal = false; build(); }
    });

    // Modal confirm
    container.querySelector('#confirm-create-btn')?.addEventListener('click', async () => {
      const nameInput = container.querySelector<HTMLInputElement>('#new-merchant-name');
      const idInput = container.querySelector<HTMLInputElement>('#new-merchant-id');
      const tenantInput = container.querySelector<HTMLSelectElement>('#new-merchant-tenant');
      const errorEl = container.querySelector<HTMLElement>('#create-error');

      const name = nameInput?.value.trim() ?? '';
      const id = idInput?.value.trim() ?? '';
      const tenantId = tenantInput?.value ?? activeTenantId;

      if (!name) { showError('Merchant name is required.'); return; }
      if (!id) { showError('Merchant ID is required.'); return; }
      if (MOCK_MERCHANTS.find(m => m.id === id)) { showError(`Merchant ID "${id}" already exists.`); return; }

      function showError(msg: string) {
        if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
      }

      const confirmBtn = container.querySelector<HTMLButtonElement>('#confirm-create-btn');
      if (confirmBtn) { confirmBtn.textContent = 'Creating...'; confirmBtn.disabled = true; }

      try {
        await createMerchant(id, tenantId, name);
        showCreateModal = false;
        store.setState({
          activeTenantId: tenantId,
          activeMerchantId: id,
          editingConfig: JSON.parse(JSON.stringify(getMerchantById(id)!.config)),
          isDirty: false,
        });
        navigate('#/app-config');
      } catch {
        showError('Failed to create merchant. Please try again.');
        if (confirmBtn) { confirmBtn.textContent = 'Create Merchant'; confirmBtn.disabled = false; }
      }
    });
  }

  build();

  const unsub = store.subscribe(() => build());
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) { unsub(); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
