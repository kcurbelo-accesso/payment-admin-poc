import { MOCK_STACKS, getMerchantsForTenant, getMerchantsForStack, getMerchantById, getTenantsForStack, getStackById } from '../data/mock';
import { APP_REGISTRY, buildPreviewUrl } from '../data/appRegistry';
import { store } from '../services/store';
import { ROUTES, getRoute } from '../router';
import { DEPLOYMENT_MODE } from '../config';

export function renderTopbar(container: HTMLElement): void {
  function build() {
    const state = store.getState();
    const currentRoute = getRoute();
    const currentSection = ROUTES.find(r => r.route === currentRoute)?.label ?? 'Dashboard';
    const activeStack = getStackById(state.activeStackId);
    const tenantsInStack = getTenantsForStack(state.activeStackId);
    const merchants = state.activeTenantId === 'all'
      ? getMerchantsForStack(state.activeStackId)
      : getMerchantsForTenant(state.activeTenantId);
    const activeMerchant = state.activeMerchantId ? getMerchantById(state.activeMerchantId) : null;

    container.innerHTML = `
      <header style="
        height: 60px; background: rgba(255,255,255,0.88);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(226,232,240,0.8);
        display: flex; align-items: center; padding: 0 24px; gap: 14px;
        box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(15,23,42,0.04);
        position: sticky; top: 0; z-index: 50;
      ">

        <!-- Breadcrumb -->
        <div style="display: flex; align-items: center; gap: 7px; flex-shrink: 0;">
          <span style="color: #cbd5e1; font-size: 12px; font-weight: 500; letter-spacing: -0.2px;">aPay</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color: #cbd5e1; flex-shrink: 0;">
            <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="color: #0f172a; font-size: 14px; font-weight: 700; letter-spacing: -0.3px;">${currentSection}</span>
        </div>

        <div style="flex: 1;"></div>

        <!-- Context pill group: Stack → Tenant → Merchant -->
        <div style="
          display: flex; align-items: center;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 4px; gap: 4px;
        ">

          ${DEPLOYMENT_MODE === 'global' ? `
          <!-- Stack select (global mode) -->
          <div style="position: relative; display: flex; align-items: center;">
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 6px 0 4px; white-space: nowrap;">Stack</span>
            <select id="topbar-stack-select" style="
              appearance: none; background: white; border: 1px solid #e2e8f0; border-radius: 7px;
              padding: 5px 26px 5px 9px; font-family: inherit; font-size: 12px; font-weight: 700; color: #0f172a;
              cursor: pointer; min-width: 90px; letter-spacing: -0.2px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            ">
              ${MOCK_STACKS.map(s => `
                <option value="${s.id}" ${s.id === state.activeStackId ? 'selected' : ''}>${s.name}</option>
              `).join('')}
            </select>
            <svg style="position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;" width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div style="width: 1px; height: 20px; background: #e2e8f0; flex-shrink: 0;"></div>
          ` : `
          <!-- Stack badge (single-stack mode) -->
          <div style="display: flex; align-items: center; gap: 5px; padding: 4px 10px 4px 8px; background: white; border: 1px solid #e2e8f0; border-radius: 7px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
            <div style="
              width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
              background: ${activeStack?.type === 'dedicated' ? '#8b5cf6' : '#3b82f6'};
              box-shadow: 0 0 0 2px ${activeStack?.type === 'dedicated' ? '#ede9fe' : '#dbeafe'};
            "></div>
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em;">Stack</span>
            <span style="font-size: 12.5px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">${activeStack?.name ?? state.activeStackId}</span>
          </div>
          <div style="width: 1px; height: 20px; background: #e2e8f0; flex-shrink: 0;"></div>
          `}

          <!-- Tenant select -->
          <div style="position: relative; display: flex; align-items: center;">
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 6px 0 4px; white-space: nowrap;">Tenant</span>
            <select id="topbar-tenant-select" style="
              appearance: none; background: white; border: 1px solid #e2e8f0; border-radius: 7px;
              padding: 5px 26px 5px 9px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: #0f172a;
              cursor: pointer; min-width: 130px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            ">
              <option value="all" ${state.activeTenantId === 'all' ? 'selected' : ''}>All Tenants</option>
              ${tenantsInStack.map(t => `
                <option value="${t.id}" ${t.id === state.activeTenantId ? 'selected' : ''}>${t.name}</option>
              `).join('')}
            </select>
            <svg style="position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;" width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Merchant select -->
          <div style="position: relative; display: flex; align-items: center;">
            <span style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 6px 0 4px; white-space: nowrap;">Merchant</span>
            <select id="topbar-merchant-select" style="
              appearance: none; background: white; border: 1px solid #e2e8f0; border-radius: 7px;
              padding: 5px 26px 5px 9px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: #0f172a;
              cursor: pointer; min-width: 160px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            ">
              <option value="">— Select —</option>
              ${merchants.map(m => `
                <option value="${m.id}" ${m.id === state.activeMerchantId ? 'selected' : ''}>${m.name}</option>
              `).join('')}
            </select>
            <svg style="position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;" width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Active merchant pill -->
        ${activeMerchant ? `
          <div style="
            display: flex; align-items: center; gap: 8px;
            background: linear-gradient(130deg, #eff6ff, #dbeafe);
            border: 1px solid #bfdbfe; border-radius: 20px; padding: 5px 12px 5px 8px;
          ">
            <div style="
              width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
              background: linear-gradient(135deg, ${activeMerchant.config.merchant.theme.primaryColor}, ${activeMerchant.config.merchant.theme.secondaryColor});
            "></div>
            <span style="font-size: 12.5px; font-weight: 700; color: #1d4ed8; letter-spacing: -0.2px;">${activeMerchant.name}</span>
          </div>
        ` : ''}

        <!-- Preview button -->
        <button
          id="topbar-preview-btn"
          class="btn btn-primary"
          style="font-size: 12px; padding: 6px 14px; gap: 5px; ${!state.activeMerchantId ? 'opacity: 0.4; cursor: not-allowed; pointer-events: none;' : ''}"
          ${!state.activeMerchantId ? 'disabled' : ''}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 11L11 2M11 2H5.5M11 2V7.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Preview App
        </button>
      </header>
    `;

    const stackSelect = container.querySelector<HTMLSelectElement>('#topbar-stack-select');
    stackSelect?.addEventListener('change', () => {
      const newStackId = stackSelect.value;
      const firstTenant = getTenantsForStack(newStackId)[0];
      store.setState({
        activeStackId: newStackId,
        activeTenantId: firstTenant?.id ?? '',
        activeMerchantId: null,
        editingConfig: null,
        isDirty: false,
      });
    });

    const tenantSelect = container.querySelector<HTMLSelectElement>('#topbar-tenant-select');
    tenantSelect?.addEventListener('change', () => {
      store.setState({ activeTenantId: tenantSelect.value, activeMerchantId: null, editingConfig: null, isDirty: false });
    });

    const merchantSelect = container.querySelector<HTMLSelectElement>('#topbar-merchant-select');
    merchantSelect?.addEventListener('change', () => {
      const merchantId = merchantSelect.value || null;
      if (merchantId) {
        const merchant = getMerchantById(merchantId);
        store.setState({ activeMerchantId: merchantId, editingConfig: merchant ? JSON.parse(JSON.stringify(merchant.config)) : null, isDirty: false });
      } else {
        store.setState({ activeMerchantId: null, editingConfig: null, isDirty: false });
      }
    });

    const previewBtn = container.querySelector<HTMLButtonElement>('#topbar-preview-btn');
    previewBtn?.addEventListener('click', () => {
      if (state.activeMerchantId && state.activeTenantId) {
        store.applyPreview();
        // Default to first active app in registry — scalable for future apps
        const app = APP_REGISTRY.find((a) => a.status === 'active') ?? APP_REGISTRY[0];
        const url = buildPreviewUrl(app, state.activeTenantId, state.activeMerchantId);
        window.open(url, '_blank');
      }
    });
  }

  build();
  store.subscribe(() => build());
  window.addEventListener('hashchange', () => build());
}
