import {
  getMerchantsForStack, getMerchantsForTenant, getTenantsForStack, getStackById,
  getAnalyticsForMerchant,
} from '../data/mock';
import { store } from '../services/store';
import { PM_BY_CODE } from '../data/paymentMethodRegistry';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + Math.floor(n).toLocaleString('en-US');
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pmLabel(code: string): string { return PM_BY_CODE[code]?.name ?? code; }
function pmColor(code: string): string { return PM_BY_CODE[code]?.color ?? '#94a3b8'; }

// ── SVG line chart ─────────────────────────────────────────────────────────────

function renderLineChart(
  values: number[],
  color: string,
  gradientId: string,
  yFmt: (v: number) => string,
  xLabels: string[],
): string {
  const W = 1000, H = 180;
  const pL = 64, pR = 16, pT = 14, pB = 38;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const max = Math.max(...values, 1);
  const n = values.length;

  const xp = (i: number) => pL + (n <= 1 ? cW / 2 : (i / (n - 1)) * cW);
  const yp = (v: number) => pT + cH - (v / max) * cH;

  const pts = values.map((v, i) => `${xp(i).toFixed(1)},${yp(v).toFixed(1)}`).join(' ');
  const area = [
    `${xp(0).toFixed(1)},${(pT + cH).toFixed(1)}`,
    ...values.map((v, i) => `${xp(i).toFixed(1)},${yp(v).toFixed(1)}`),
    `${xp(n - 1).toFixed(1)},${(pT + cH).toFixed(1)}`,
  ].join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: (pT + cH - p * cH).toFixed(1),
    label: yFmt(max * p),
  }));

  const step = Math.max(1, Math.ceil(n / 6));
  const visibleXLabels = xLabels
    .map((l, i) => ({ l, i, show: i % step === 0 || i === n - 1 }))
    .filter((x) => x.show);

  return `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;overflow:visible;">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
        </linearGradient>
      </defs>
      ${yTicks.map((t) => `
        <line x1="${pL}" y1="${t.y}" x2="${W - pR}" y2="${t.y}" stroke="#f1f5f9" stroke-width="1"/>
        <text x="${pL - 8}" y="${t.y}" text-anchor="end" dominant-baseline="middle"
          fill="#94a3b8" font-size="10" font-family="Inter,system-ui">${t.label}</text>
      `).join('')}
      ${visibleXLabels.map(({ l, i }) => `
        <text x="${xp(i).toFixed(1)}" y="${(pT + cH + 16).toFixed(1)}" text-anchor="middle"
          fill="#94a3b8" font-size="10" font-family="Inter,system-ui">${l}</text>
      `).join('')}
      <polygon points="${area}" fill="url(#${gradientId})"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${values.map((v, i) => `
        <circle cx="${xp(i).toFixed(1)}" cy="${yp(v).toFixed(1)}" r="3" fill="white" stroke="${color}" stroke-width="2">
          <title>${xLabels[i]}: ${yFmt(v)}</title>
        </circle>
      `).join('')}
    </svg>`;
}

// ── Main render ───────────────────────────────────────────────────────────────

export function renderDashboard(container: HTMLElement): void {
  let dateRange: '7d' | '14d' | '30d' = '30d';
  let merchantFilter = 'all';
  let paymentMethodFilter = 'all';

  // Track to reset local filters when the global context changes
  let prevStackId = store.getState().activeStackId;
  let prevTenantId = store.getState().activeTenantId;

  function build() {
    const state = store.getState();
    const { activeStackId, activeTenantId } = state;

    // Reset local filters when the topbar scope changes
    if (activeStackId !== prevStackId || activeTenantId !== prevTenantId) {
      merchantFilter = 'all';
      paymentMethodFilter = 'all';
      prevStackId = activeStackId;
      prevTenantId = activeTenantId;
    }

    const stackTenants = getTenantsForStack(activeStackId);
    const activeStack = getStackById(activeStackId);

    // Scope merchants to the active tenant, or the entire stack when 'all'
    const scopedMerchants = activeTenantId === 'all'
      ? getMerchantsForStack(activeStackId)
      : getMerchantsForTenant(activeTenantId);

    const activeTenantName = activeTenantId === 'all'
      ? 'All Tenants'
      : (stackTenants.find((t) => t.id === activeTenantId)?.name ?? activeTenantId);

    // ── Apply filters ──────────────────────────────────────────────────────────

    const allAnalytics = scopedMerchants.flatMap((m) => getAnalyticsForMerchant(m.id));
    const allDates = [...new Set(allAnalytics.map((a) => a.date))].sort();

    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    const filteredDateSet = new Set(allDates.slice(-days));
    const filteredDates = [...filteredDateSet].sort();

    const activeMerchants =
      merchantFilter === 'all'
        ? scopedMerchants
        : scopedMerchants.filter((m) => m.id === merchantFilter);

    const analytics = activeMerchants
      .flatMap((m) => getAnalyticsForMerchant(m.id))
      .filter((a) => filteredDateSet.has(a.date));

    // ── KPIs ───────────────────────────────────────────────────────────────────

    const totalRevenue = analytics.reduce((s, a) => s + a.revenue, 0);
    const totalSessions = analytics.reduce((s, a) => s + a.sessions, 0);
    const totalTransactions = analytics.reduce((s, a) => s + a.transactions, 0);
    const totalSuccess = analytics.reduce((s, a) => s + a.successCount, 0);
    const totalFailure = analytics.reduce((s, a) => s + a.failureCount, 0);
    const successRate = totalTransactions > 0 ? (totalSuccess / totalTransactions) * 100 : 0;
    const conversionRate = totalSessions > 0 ? (totalSuccess / totalSessions) * 100 : 0;
    const avgOrderValue = totalSuccess > 0 ? totalRevenue / totalSuccess : 0;

    // ── Daily series for charts ────────────────────────────────────────────────

    const dailyRevenue: Record<string, number> = {};
    const dailyTx: Record<string, number> = {};
    const dailySessions: Record<string, number> = {};
    filteredDates.forEach((d) => { dailyRevenue[d] = 0; dailyTx[d] = 0; dailySessions[d] = 0; });
    analytics.forEach((a) => {
      dailyRevenue[a.date] = (dailyRevenue[a.date] || 0) + a.revenue;
      dailyTx[a.date] = (dailyTx[a.date] || 0) + a.transactions;
      dailySessions[a.date] = (dailySessions[a.date] || 0) + a.sessions;
    });

    const revenueValues = filteredDates.map((d) => dailyRevenue[d] || 0);
    const txValues = filteredDates.map((d) => dailyTx[d] || 0);
    const xLabels = filteredDates.map(fmtDate);
    const maxTx = Math.max(...txValues, 1);

    // ── Payment method mix ─────────────────────────────────────────────────────

    // Collect all PM codes that have any data in the current merchant/date scope
    const availablePmCodes = new Set<string>();
    analytics.forEach((a) => {
      Object.keys(a.byPaymentMethod ?? {}).forEach((k) => availablePmCodes.add(k));
    });

    const pmTotals: Record<string, number> = {};
    analytics.forEach((a) => {
      Object.entries(a.byPaymentMethod ?? {}).forEach(([k, v]) => {
        // Apply payment method filter for scoped view
        if (paymentMethodFilter !== 'all' && k !== paymentMethodFilter) return;
        pmTotals[k] = (pmTotals[k] || 0) + v;
      });
    });
    const pmTotal = Object.values(pmTotals).reduce((s, v) => s + v, 0);

    // ── Top merchants ──────────────────────────────────────────────────────────

    const merchantRows = activeMerchants
      .map((m) => {
        const ma = getAnalyticsForMerchant(m.id).filter((a) => filteredDateSet.has(a.date));
        const rev = ma.reduce((s, a) => s + a.revenue, 0);
        const tx = ma.reduce((s, a) => s + a.transactions, 0);
        const sc = ma.reduce((s, a) => s + a.successCount, 0);
        const sess = ma.reduce((s, a) => s + a.sessions, 0);
        return {
          id: m.id,
          name: m.config.merchant.name,
          tenantId: m.tenantId,
          revenue: rev,
          transactions: tx,
          successRate: tx > 0 ? (sc / tx) * 100 : 0,
          convRate: sess > 0 ? (sc / sess) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const maxMerchantRev = merchantRows[0]?.revenue || 1;

    // ── Tenant revenue (for aggregate view) ────────────────────────────────────

    const tenantRevMap: Record<string, number> = {};
    stackTenants.forEach((t) => { tenantRevMap[t.id] = 0; });
    activeMerchants.forEach((m) => {
      const rev = getAnalyticsForMerchant(m.id)
        .filter((a) => filteredDateSet.has(a.date))
        .reduce((s, a) => s + a.revenue, 0);
      if (tenantRevMap[m.tenantId] !== undefined) tenantRevMap[m.tenantId] += rev;
    });
    const maxTenantRev = Math.max(...Object.values(tenantRevMap), 1);
    const TENANT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

    // ── Render ─────────────────────────────────────────────────────────────────

    container.innerHTML = `
      <div class="page-enter" style="padding:28px 32px;max-width:1600px;">

        <!-- Header + Filters -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
          <div>
            <h1 style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;margin:0;">Analytics</h1>
            <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">
              ${activeStack?.name ?? activeStackId} &nbsp;·&nbsp; ${activeTenantName} &nbsp;·&nbsp; Data source: Google Analytics
            </p>
          </div>

          <!-- Filter bar -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <!-- Date range -->
            <div style="display:flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:2px;">
              ${(['7d', '14d', '30d'] as const)
                .map(
                  (r) => `
                <button data-range="${r}" style="
                  font-size:12px;font-weight:600;padding:5px 13px;border:none;border-radius:6px;cursor:pointer;transition:all 0.15s;
                  background:${dateRange === r ? 'white' : 'transparent'};
                  color:${dateRange === r ? '#0f172a' : '#64748b'};
                  box-shadow:${dateRange === r ? '0 1px 4px rgba(0,0,0,0.09)' : 'none'};
                ">${r === '7d' ? 'Last 7D' : r === '14d' ? 'Last 14D' : 'Last 30D'}</button>
              `,
                )
                .join('')}
            </div>

            <!-- Merchant -->
            <div style="position:relative;">
              <select id="filter-merchant" class="form-input" style="font-size:12px;padding:6px 10px;min-width:170px;">
                <option value="all">All Merchants</option>
                ${scopedMerchants
                  .map(
                    (m) => `
                  <option value="${m.id}" ${merchantFilter === m.id ? 'selected' : ''}>${m.config.merchant.name}</option>
                `,
                  )
                  .join('')}
              </select>
            </div>

            <!-- Payment method -->
            <div style="position:relative;">
              <select id="filter-pm" class="form-input" style="font-size:12px;padding:6px 10px;min-width:155px;">
                <option value="all">All Methods</option>
                ${[...availablePmCodes]
                  .sort((a, b) => pmLabel(a).localeCompare(pmLabel(b)))
                  .map(
                    (code) => `
                  <option value="${code}" ${paymentMethodFilter === code ? 'selected' : ''}>${pmLabel(code)}</option>
                `,
                  )
                  .join('')}
              </select>
            </div>

            ${merchantFilter !== 'all' || paymentMethodFilter !== 'all' ? `
              <button id="clear-filters" style="font-size:11px;font-weight:600;color:#64748b;background:none;border:1px solid #e2e8f0;border-radius:7px;padding:5px 10px;cursor:pointer;">
                Clear filters
              </button>
            ` : ''}
          </div>
        </div>

        <!-- KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
          ${[
            {
              label: 'Revenue',
              value: fmtCurrency(totalRevenue),
              sub: `Avg order ${fmtCurrency(avgOrderValue)}`,
              icon: '💰',
              from: '#eff6ff', to: '#dbeafe', accent: '#2563eb',
            },
            {
              label: 'Sessions',
              value: fmtNumber(totalSessions),
              sub: `${conversionRate.toFixed(1)}% conversion`,
              icon: '👁',
              from: '#f0fdf4', to: '#dcfce7', accent: '#15803d',
            },
            {
              label: 'Transactions',
              value: fmtNumber(totalTransactions),
              sub: `${fmtNumber(totalFailure)} failed`,
              icon: '⚡',
              from: '#f5f3ff', to: '#ede9fe', accent: '#7c3aed',
            },
            {
              label: 'Success Rate',
              value: successRate.toFixed(1) + '%',
              sub: `${fmtNumber(totalSuccess)} completed`,
              icon: '✓',
              from: '#fffbeb', to: '#fef3c7', accent: '#d97706',
            },
          ]
            .map(
              ({ label, value, sub, icon, from, to, accent }) => `
            <div class="card" style="
              background:linear-gradient(145deg,${from},${to});
              border:none;padding:20px;position:relative;overflow:hidden;
            ">
              <div style="position:absolute;top:-14px;right:-14px;width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.22);pointer-events:none;"></div>
              <div style="font-size:22px;margin-bottom:10px;">${icon}</div>
              <div style="font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-1px;line-height:1;">${value}</div>
              <div style="font-size:12px;color:#475569;margin-top:4px;font-weight:600;">${label}</div>
              <div style="font-size:11px;color:${accent};margin-top:5px;font-weight:500;">${sub}</div>
            </div>
          `,
            )
            .join('')}
        </div>

        <!-- Revenue Trend -->
        <div class="card" style="margin-bottom:20px;padding:20px 24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;">Revenue Trend</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                Total ${fmtCurrency(totalRevenue)} &nbsp;·&nbsp; ${days} days
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b;">
              <span style="display:inline-block;width:20px;height:2.5px;background:#2563eb;border-radius:2px;vertical-align:middle;"></span> Revenue
            </div>
          </div>
          ${renderLineChart(revenueValues, '#2563eb', 'revGrad', fmtCurrency, xLabels)}
        </div>

        <!-- Mid row: Transaction volume + Payment method mix -->
        <div style="display:grid;grid-template-columns:3fr 2fr;gap:20px;margin-bottom:20px;">

          <!-- Transaction Volume bar chart -->
          <div class="card">
            <div style="margin-bottom:16px;">
              <div style="font-size:14px;font-weight:700;color:#0f172a;">Transaction Volume</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                ${fmtNumber(totalTransactions)} total &nbsp;·&nbsp;
                <span style="color:#15803d;">${fmtNumber(totalSuccess)} ok</span>
                &nbsp;/&nbsp;
                <span style="color:#b91c1c;">${fmtNumber(totalFailure)} failed</span>
              </div>
            </div>
            <div style="display:flex;align-items:flex-end;gap:${days > 14 ? '3' : '5'}px;height:120px;padding-bottom:26px;position:relative;">
              <div style="position:absolute;bottom:26px;left:0;right:0;height:1px;background:#f1f5f9;pointer-events:none;"></div>
              ${filteredDates
                .map((d, i) => {
                  const vol = txValues[i] || 0;
                  const hPct = Math.max((vol / maxTx) * 100, 2);
                  const showLabel = days <= 14 || i % Math.ceil(days / 7) === 0 || i === days - 1;
                  return `
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">
                    <div style="
                      width:100%;height:${hPct.toFixed(1)}%;
                      background:linear-gradient(180deg,#60a5fa 0%,#2563eb 100%);
                      border-radius:3px 3px 2px 2px;opacity:0.85;
                    " title="${fmtDate(d)}: ${vol.toLocaleString()} transactions"></div>
                    <span style="font-size:8.5px;color:${showLabel ? '#94a3b8' : 'transparent'};margin-top:5px;white-space:nowrap;">
                      ${fmtDate(d)}
                    </span>
                  </div>`;
                })
                .join('')}
            </div>
          </div>

          <!-- Payment Method Mix -->
          <div class="card">
            <div style="margin-bottom:16px;">
              <div style="font-size:14px;font-weight:700;color:#0f172a;">Payment Method Mix</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                ${fmtNumber(pmTotal)} successful transactions
                ${paymentMethodFilter !== 'all' ? `<span style="font-size:10px;font-weight:700;background:#eff6ff;color:#2563eb;padding:1px 6px;border-radius:99px;margin-left:4px;">filtered</span>` : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px;">
              ${Object.entries(pmTotals).length === 0
                ? `<div style="font-size:12px;color:#94a3b8;text-align:center;padding:24px 0;">No data</div>`
                : Object.entries(pmTotals)
                    .filter(([, v]) => v > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, count]) => {
                      const pct = pmTotal > 0 ? (count / pmTotal) * 100 : 0;
                      const color = pmColor(method);
                      return `
                        <div>
                          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <div style="display:flex;align-items:center;gap:7px;">
                              <div style="width:9px;height:9px;border-radius:2px;background:${color};flex-shrink:0;"></div>
                              <span style="font-size:12px;font-weight:500;color:#374151;">${pmLabel(method)}</span>
                            </div>
                            <span style="font-size:12px;font-weight:700;color:#0f172a;">
                              ${pct.toFixed(1)}%
                              <span style="font-size:10px;font-weight:400;color:#94a3b8;margin-left:3px;">${fmtNumber(count)}</span>
                            </span>
                          </div>
                          <div style="height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
                            <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:99px;opacity:0.8;"></div>
                          </div>
                        </div>`;
                    })
                    .join('')}
            </div>
          </div>
        </div>

        <!-- Tenant revenue breakdown (only when all tenants selected and not filtered to one merchant) -->
        ${activeTenantId === 'all' && merchantFilter === 'all' && stackTenants.length > 1 ? `
        <div class="card" style="margin-bottom:20px;">
          <div style="margin-bottom:16px;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;">Revenue by Tenant</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${activeStack?.name ?? activeStackId}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            ${stackTenants
              .map((t, ti) => {
                const rev = tenantRevMap[t.id] || 0;
                const pct = (rev / maxTenantRev) * 100;
                const color = TENANT_COLORS[ti % TENANT_COLORS.length];
                const planColors: Record<string, string> = { enterprise: '#7c3aed', pro: '#0891b2', starter: '#64748b' };
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:8px;height:8px;border-radius:2px;background:${color};flex-shrink:0;"></div>
                        <span style="font-size:13px;font-weight:600;color:#374151;">${t.name}</span>
                        <span class="badge" style="background:${planColors[t.plan] ?? '#64748b'}22;color:${planColors[t.plan] ?? '#64748b'};font-size:10px;">${t.plan}</span>
                      </div>
                      <span style="font-size:13px;font-weight:700;color:#0f172a;">${fmtCurrency(rev)}</span>
                    </div>
                    <div style="height:7px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
                      <div style="height:100%;width:${pct.toFixed(1)}%;background:linear-gradient(90deg,${color}cc,${color});border-radius:99px;"></div>
                    </div>
                  </div>`;
              })
              .join('')}
          </div>
        </div>
        ` : ''}

        <!-- Top Merchants Table -->
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:14px;font-weight:700;color:#0f172a;">
                ${merchantFilter === 'all' ? 'Top Merchants' : 'Merchant Detail'}
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                Ranked by revenue · ${days} days
              </div>
            </div>
            <span style="font-size:11px;color:#94a3b8;">${merchantRows.length} merchant${merchantRows.length !== 1 ? 's' : ''}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                ${['#', 'Merchant', 'Revenue', 'Transactions', 'Success Rate', 'Conversion', 'Revenue Share'].map((h, i) => `
                  <th style="padding:10px 20px;text-align:${i >= 2 && i <= 5 ? 'right' : i === 6 ? 'left' : 'left'};font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${h}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${merchantRows
                .map(
                  (m, i) => {
                    const barPct = (m.revenue / maxMerchantRev) * 100;
                    const srColor = m.successRate >= 95 ? '#15803d' : m.successRate >= 88 ? '#d97706' : '#b91c1c';
                    const srBg = m.successRate >= 95 ? '#dcfce7' : m.successRate >= 88 ? '#fef3c7' : '#fee2e2';
                    return `
                    <tr style="border-top:1px solid #f8fafc;"
                      onmouseover="this.style.background='#f8fafc'"
                      onmouseout="this.style.background='transparent'">
                      <td style="padding:12px 20px;font-size:12px;color:#94a3b8;font-weight:600;">${i + 1}</td>
                      <td style="padding:12px 20px;">
                        <div style="font-size:13px;font-weight:600;color:#0f172a;">${m.name}</div>
                        <div style="font-size:10px;color:#94a3b8;font-family:monospace;">${m.id}</div>
                      </td>
                      <td style="padding:12px 20px;text-align:right;font-size:13px;font-weight:700;color:#0f172a;">${fmtCurrency(m.revenue)}</td>
                      <td style="padding:12px 20px;text-align:right;font-size:13px;color:#374151;">${fmtNumber(m.transactions)}</td>
                      <td style="padding:12px 20px;text-align:right;">
                        <span style="font-size:11px;font-weight:700;background:${srBg};color:${srColor};padding:2px 8px;border-radius:99px;">
                          ${m.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style="padding:12px 20px;text-align:right;font-size:12px;color:#64748b;">
                        ${m.convRate.toFixed(1)}%
                      </td>
                      <td style="padding:12px 20px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="flex:1;height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;min-width:60px;">
                            <div style="height:100%;width:${barPct.toFixed(1)}%;background:linear-gradient(90deg,#60a5fa,#2563eb);border-radius:99px;"></div>
                          </div>
                          <span style="font-size:10px;color:#94a3b8;font-weight:600;">${barPct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>`;
                  },
                )
                .join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;

    // ── Event handlers ────────────────────────────────────────────────────────

    container.querySelectorAll<HTMLButtonElement>('[data-range]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dateRange = btn.dataset.range as '7d' | '14d' | '30d';
        build();
      });
    });

    container.querySelector<HTMLSelectElement>('#filter-merchant')?.addEventListener('change', (e) => {
      merchantFilter = (e.target as HTMLSelectElement).value;
      build();
    });

    container.querySelector<HTMLSelectElement>('#filter-pm')?.addEventListener('change', (e) => {
      paymentMethodFilter = (e.target as HTMLSelectElement).value;
      build();
    });

    container.querySelector('#clear-filters')?.addEventListener('click', () => {
      merchantFilter = 'all';
      paymentMethodFilter = 'all';
      build();
    });
  }

  build();

  const unsub = store.subscribe(() => build());
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) {
      unsub();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
