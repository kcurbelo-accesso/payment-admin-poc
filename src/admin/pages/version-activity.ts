import { MOCK_MERCHANTS, getMerchantsForTenant, getMerchantsForStack, type Merchant } from '../data/mock';
import { getVersionSummaries, getMerchantVersionSummary, type VersionSummary } from '../data/mockNginxLogs';
import { store } from '../services/store';

type ViewTab = 'by-version' | 'by-merchant';
let activeTab: ViewTab = 'by-version';
let selectedMerchantId = '';

export function renderVersionActivity(container: HTMLElement): void {
  function build() {
    const summaries = getVersionSummaries();
    const state = store.getState();
    selectedMerchantId = state.activeMerchantId ?? '';
    const scopedMerchants = state.activeTenantId === 'all'
      ? getMerchantsForStack(state.activeStackId)
      : getMerchantsForTenant(state.activeTenantId);

    container.innerHTML = `
      <div style="padding:28px 32px;font-family:inherit;max-width:1100px">

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px">
          <div>
            <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 4px">Version Activity</h1>
            <p style="font-size:13px;color:#64748b;margin:0">Live traffic across all accessoPay versions · nginx access logs · 30-day window</p>
          </div>
          <div style="display:flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 12px">
            <div style="width:7px;height:7px;background:#22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,0.2)"></div>
            <span style="font-size:12px;font-weight:600;color:#15803d">Log source: Coralogix</span>
          </div>
        </div>

        <!-- View tabs -->
        <div style="display:flex;gap:2px;background:#f1f5f9;border-radius:9px;padding:3px;margin-bottom:24px;width:fit-content">
          ${(['by-version', 'by-merchant'] as ViewTab[]).map((t) => {
            const labels: Record<ViewTab, string> = { 'by-version': 'By Version', 'by-merchant': 'By Merchant' };
            const active = t === activeTab;
            return `<button data-tab="${t}" style="
              padding:6px 18px;border-radius:7px;border:none;cursor:pointer;
              font-size:13px;font-weight:${active ? '600' : '500'};font-family:inherit;
              background:${active ? 'white' : 'transparent'};
              color:${active ? '#0f172a' : '#64748b'};
              box-shadow:${active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'};
              transition:all 0.15s;
            ">${labels[t]}</button>`;
          }).join('')}
        </div>

        <!-- Content -->
        <div id="va-content">
          ${activeTab === 'by-version' ? renderByVersion(summaries) : renderByMerchant(scopedMerchants)}
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab as ViewTab;
        build();
      });
    });

    container.querySelector<HTMLSelectElement>('#merchant-select')?.addEventListener('change', (e) => {
      const id = (e.target as HTMLSelectElement).value;
      const merchant = MOCK_MERCHANTS.find((m) => m.id === id);
      store.setState({
        activeMerchantId: id,
        editingConfig: merchant ? JSON.parse(JSON.stringify(merchant.config)) : null,
        isDirty: false,
      });
    });

    // Row click in all-merchants view → select that merchant
    container.querySelectorAll<HTMLTableRowElement>('tr[data-merchant-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.merchantId!;
        const merchant = MOCK_MERCHANTS.find((m) => m.id === id);
        store.setState({
          activeMerchantId: id,
          editingConfig: merchant ? JSON.parse(JSON.stringify(merchant.config)) : null,
          isDirty: false,
        });
      });
    });

    // Back button in single-merchant view → deselect merchant
    container.querySelector('#va-back-btn')?.addEventListener('click', () => {
      store.setState({ activeMerchantId: null, editingConfig: null, isDirty: false });
    });
  }

  build();
  store.subscribe(() => build());
}

function renderByVersion(summaries: VersionSummary[]): string {
  const rows = summaries.map((s) => {
    const lastSeen = new Date(s.lastSeen);
    const daysAgo = Math.floor((Date.now() - lastSeen.getTime()) / 86400000);
    const daysLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
    const errorRate = s.requestCount > 0 ? ((s.errorCount / s.requestCount) * 100).toFixed(1) : '0.0';

    return `
      <tr style="border-bottom:1px solid #f1f5f9;transition:background 0.1s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding:14px 16px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:14px;font-weight:700;color:#0f172a;font-family:monospace">v${s.version}</span>
            <span style="
              font-size:10px;font-weight:700;letter-spacing:0.06em;padding:2px 8px;border-radius:999px;
              ${s.isActive
                ? 'background:#dcfce7;color:#15803d'
                : 'background:#f1f5f9;color:#64748b'}
            ">${s.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </td>
        <td style="padding:14px 16px;font-size:13px;color:#374151">${s.requestCount.toLocaleString()}</td>
        <td style="padding:14px 16px">
          <span style="font-size:13px;color:${s.errorCount > 0 ? '#dc2626' : '#64748b'};font-weight:${s.errorCount > 0 ? '600' : '400'}">
            ${s.errorCount > 0 ? `${s.errorCount} (${errorRate}%)` : '—'}
          </span>
        </td>
        <td style="padding:14px 16px;font-size:13px;color:#374151">${s.uniqueTenants.length}</td>
        <td style="padding:14px 16px;font-size:13px;color:#374151">${s.uniqueMerchants.length}</td>
        <td style="padding:14px 16px">
          <div style="font-size:13px;color:#374151">${lastSeen.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:1px">${daysLabel} · ${lastSeen.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
        </td>
        <td style="padding:14px 16px">
          ${!s.isActive && s.uniqueMerchants.length <= 2
            ? `<span style="font-size:11px;color:#f59e0b;font-weight:600;background:#fef3c7;padding:2px 8px;border-radius:999px">⚠ Deprecation candidate</span>`
            : `<span style="font-size:11px;color:#94a3b8">—</span>`}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Version</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Requests</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Errors</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Tenants</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Merchants</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Last Seen</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:10px">
      Active = traffic received within the last 7 days. Deprecation candidates have no recent traffic and ≤ 2 merchants remaining.
      Log data retained for 30 days.
    </p>
  `;
}

function renderByMerchant(scopedMerchants: Merchant[]): string {
  if (!selectedMerchantId) {
    return renderAllMerchants(scopedMerchants);
  }
  return renderSingleMerchant(selectedMerchantId);
}

function renderAllMerchants(scopedMerchants: Merchant[]): string {
  const merchantsWithData = scopedMerchants
    .map((m) => ({ merchant: m, summaries: getMerchantVersionSummary(m.id) }))
    .filter(({ summaries }) => summaries.length > 0);

  const noDataMerchants = scopedMerchants.filter(
    (m) => !merchantsWithData.some(({ merchant }) => merchant.id === m.id)
  );

  const rows = merchantsWithData.map(({ merchant, summaries }) => {
    const current = summaries[0];
    const lastSeen = new Date(current.lastSeen);
    const daysAgo = Math.floor((Date.now() - lastSeen.getTime()) / 86400000);
    const isActive = daysAgo <= 7;
    const daysLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : daysAgo + 'd ago';
    const versionList = summaries.map((s) => 'v' + s.version).join(', ');
    const totalRequests = summaries.reduce((sum, s) => sum + s.requestCount, 0);

    return '<tr style="border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.1s" '
      + 'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'" '
      + 'data-merchant-id="' + merchant.id + '">'
      + '<td style="padding:13px 16px">'
      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<div style="width:8px;height:8px;border-radius:50%;background:' + (isActive ? '#22c55e' : '#cbd5e1') + ';flex-shrink:0"></div>'
      + '<div>'
      + '<div style="font-size:13px;font-weight:600;color:#0f172a">' + merchant.name + '</div>'
      + '<div style="font-size:11px;color:#94a3b8;margin-top:1px;font-family:monospace">' + merchant.id + '</div>'
      + '</div>'
      + '</div>'
      + '</td>'
      + '<td style="padding:13px 16px;font-size:12px;color:#64748b">' + merchant.tenantId + '</td>'
      + '<td style="padding:13px 16px">'
      + '<span style="font-size:13px;font-weight:700;color:#0f172a;font-family:monospace">v' + current.version + '</span>'
      + '</td>'
      + '<td style="padding:13px 16px;font-size:12px;color:#64748b">' + versionList + '</td>'
      + '<td style="padding:13px 16px;font-size:13px;color:#374151">' + totalRequests.toLocaleString() + '</td>'
      + '<td style="padding:13px 16px">'
      + '<div style="font-size:12px;color:#374151">' + lastSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '</div>'
      + '<div style="font-size:11px;color:#94a3b8;margin-top:1px">' + daysLabel + '</div>'
      + '</td>'
      + '</tr>';
  }).join('');

  const noDataRows = noDataMerchants.map((m) =>
    '<tr style="border-bottom:1px solid #f1f5f9">'
    + '<td style="padding:13px 16px">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<div style="width:8px;height:8px;border-radius:50%;background:#e2e8f0;flex-shrink:0"></div>'
    + '<div>'
    + '<div style="font-size:13px;font-weight:600;color:#94a3b8">' + m.name + '</div>'
    + '<div style="font-size:11px;color:#cbd5e1;margin-top:1px;font-family:monospace">' + m.id + '</div>'
    + '</div>'
    + '</div>'
    + '</td>'
    + '<td style="padding:13px 16px;font-size:12px;color:#cbd5e1">' + m.tenantId + '</td>'
    + '<td colspan="4" style="padding:13px 16px;font-size:12px;color:#cbd5e1;font-style:italic">No log data in last 30 days</td>'
    + '</tr>'
  ).join('');

  return '<p style="font-size:12px;color:#94a3b8;margin:0 0 14px">Select a merchant in the header to drill into its version history.</p>'
    + '<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">'
    + '<table style="width:100%;border-collapse:collapse">'
    + '<thead>'
    + '<tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Merchant</th>'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Tenant</th>'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Current</th>'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Versions Seen</th>'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Requests</th>'
    + '<th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Last Seen</th>'
    + '</tr>'
    + '</thead>'
    + '<tbody>' + rows + noDataRows + '</tbody>'
    + '</table>'
    + '</div>';
}

function renderSingleMerchant(merchantId: string): string {
  const merchantSummaries = getMerchantVersionSummary(merchantId);
  const merchant = MOCK_MERCHANTS.find((m) => m.id === merchantId);

  const rows = merchantSummaries.length
    ? merchantSummaries.map((s) => {
        const lastSeen = new Date(s.lastSeen);
        const daysAgo = Math.floor((Date.now() - lastSeen.getTime()) / 86400000);
        const daysLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
        const isRecent = daysAgo <= 7;

        return `
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:13px 16px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:13px;font-weight:700;color:#0f172a;font-family:monospace">v${s.version}</span>
                ${isRecent ? '<span style="font-size:10px;font-weight:700;background:#dcfce7;color:#15803d;padding:1px 7px;border-radius:999px;letter-spacing:0.05em">ACTIVE</span>' : ''}
              </div>
            </td>
            <td style="padding:13px 16px;font-size:13px;color:#374151">${s.requestCount.toLocaleString()}</td>
            <td style="padding:13px 16px;font-size:13px;color:#374151">${s.pages.join(', ')}</td>
            <td style="padding:13px 16px">
              <div style="font-size:13px;color:#374151">${lastSeen.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:1px">${daysLabel}</div>
            </td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" style="padding:40px;text-align:center;color:#94a3b8;font-size:13px">No log data found for this merchant in the last 30 days.</td></tr>`;

  return `
    <!-- Back button -->
    <div style="margin-bottom:16px">
      <button id="va-back-btn" style="
        display:inline-flex;align-items:center;gap:6px;
        background:none;border:none;cursor:pointer;padding:0;
        font-size:13px;font-weight:500;color:#64748b;font-family:inherit;
      " onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#64748b'">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        All merchants
      </button>
    </div>

    <!-- Merchant card -->
    ${merchant ? `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:16px">
        <div style="width:10px;height:10px;border-radius:50%;background:${merchantSummaries.some((s) => Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 86400000) <= 7) ? '#22c55e' : '#94a3b8'};flex-shrink:0"></div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#0f172a">${merchant.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:1px">${merchant.id} · ${merchant.tenantId}</div>
        </div>
        ${merchantSummaries[0] ? `
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:12px;color:#64748b">Current version</div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;font-family:monospace">v${merchantSummaries[0].version}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Version history table -->
    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Version</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Requests</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Pages Visited</th>
            <th style="padding:11px 16px;text-align:left;font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.06em;text-transform:uppercase">Last Seen</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
