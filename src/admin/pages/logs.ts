import { MOCK_LOGS, getLogsForMerchant, type LogEntry } from '../data/mock';
import { store } from '../services/store';

// Derived dynamically so newly published config-service entries appear in the filter
function getServices(): string[] {
  return [...new Set(MOCK_LOGS.map(l => l.service))].sort();
}
const LEVELS: LogEntry['level'][] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const PAGE_SIZE = 20;

const LEVEL_BG: Record<string, string> = {
  INFO: '#dbeafe', WARN: '#fef3c7', ERROR: '#fee2e2', DEBUG: '#f1f5f9',
};
const LEVEL_TEXT: Record<string, string> = {
  INFO: '#1d4ed8', WARN: '#b45309', ERROR: '#b91c1c', DEBUG: '#475569',
};

interface LogState {
  levelFilter: string;
  serviceFilter: string;
  searchQuery: string;
  page: number;
  expandedId: string | null;
}

export function renderLogs(container: HTMLElement): void {
  const localState: LogState = {
    levelFilter: '',
    serviceFilter: '',
    searchQuery: '',
    page: 0,
    expandedId: null,
  };

  function getFilteredLogs(): LogEntry[] {
    const { activeMerchantId } = store.getState();
    let logs = activeMerchantId ? getLogsForMerchant(activeMerchantId) : [...MOCK_LOGS];

    // Sort newest first
    logs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (localState.levelFilter) {
      logs = logs.filter(l => l.level === localState.levelFilter);
    }
    if (localState.serviceFilter) {
      logs = logs.filter(l => l.service === localState.serviceFilter);
    }
    if (localState.searchQuery) {
      const q = localState.searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.message.toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q) ||
        l.merchantId.toLowerCase().includes(q)
      );
    }
    return logs;
  }

  function formatTs(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  }

  function build() {
    const { activeMerchantId } = store.getState();
    const allFiltered = getFilteredLogs();
    const totalCount = allFiltered.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const pageLogs = allFiltered.slice(localState.page * PAGE_SIZE, (localState.page + 1) * PAGE_SIZE);

    container.innerHTML = `
      <div class="page-enter" style="padding: 28px 32px; max-width: 1440px;">

        <!-- Page header -->
        <div style="margin-bottom: 24px; display: flex; align-items: flex-start; justify-content: space-between;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Logs</h1>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 5px; font-weight: 500;">
              ${activeMerchantId ? `Filtered to <strong style="color:#475569;">${activeMerchantId}</strong>` : 'All merchants · Last 24 hours'}
            </p>
          </div>
          ${activeMerchantId ? `
            <button class="btn btn-ghost" id="clear-merchant-filter" style="font-size: 12px; margin-top: 4px;">
              Clear merchant filter ×
            </button>
          ` : ''}
        </div>

        <!-- Filter bar -->
        <div style="
          background: white; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 18px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        ">
          <!-- Level pills -->
          <div style="display: flex; gap: 6px; align-items: center;">
            ${['', ...LEVELS].map(l => {
              const active = localState.levelFilter === l;
              const levelStyle: Record<string, string> = {
                '': active ? 'background:#0f172a;color:white;border-color:#0f172a;' : 'color:#64748b;',
                INFO: active ? 'background:#dbeafe;color:#1d4ed8;border-color:#bfdbfe;font-weight:700;' : 'color:#94a3b8;',
                WARN: active ? 'background:#fef3c7;color:#b45309;border-color:#fde68a;font-weight:700;' : 'color:#94a3b8;',
                ERROR: active ? 'background:#fee2e2;color:#b91c1c;border-color:#fca5a5;font-weight:700;' : 'color:#94a3b8;',
                DEBUG: active ? 'background:#f1f5f9;color:#475569;border-color:#cbd5e1;font-weight:700;' : 'color:#94a3b8;',
              };
              return `
                <button data-level-pill="${l}" style="
                  padding: 4px 12px; border-radius: 99px; border: 1.5px solid #e2e8f0;
                  font-family: inherit; font-size: 11.5px; font-weight: 600;
                  cursor: pointer; background: transparent; transition: all 0.15s;
                  ${levelStyle[l] || ''}
                ">${l || 'All'}</button>
              `;
            }).join('')}
          </div>

          <div style="width: 1px; height: 24px; background: #e2e8f0;"></div>

          <!-- Service select -->
          <div style="position: relative; display: flex; align-items: center;">
            <select class="form-input" id="log-service-filter" style="width: 170px; font-size: 12px; padding: 6px 30px 6px 10px; appearance: none;">
              <option value="" ${!localState.serviceFilter ? 'selected' : ''}>All services</option>
              ${getServices().map(s => `<option value="${s}" ${localState.serviceFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <svg style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;" width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- Search -->
          <div style="flex: 1; min-width: 220px; position: relative;">
            <input
              class="form-input"
              type="text"
              id="log-search"
              placeholder="Search messages, services, merchants..."
              value="${localState.searchQuery}"
              style="padding-left: 32px; font-size: 12.5px;"
            >
            <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="#94a3b8" stroke-width="1.5"/>
              <path d="M10 10l-2-2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>

          <button class="btn btn-ghost" id="log-clear-btn" style="font-size: 12px; padding: 6px 12px;">Clear all</button>
        </div>

        <!-- Log table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 160px;">
              <col style="width: 70px;">
              <col style="width: 150px;">
              <col style="width: 110px;">
              <col>
            </colgroup>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Service</th>
                <th>Merchant</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              ${pageLogs.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
                    No log entries match your filters.
                  </td>
                </tr>
              ` : pageLogs.map((log, idx) => {
                const isExpanded = localState.expandedId === log.id;
                const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                return `
                  <tr
                    data-log-id="${log.id}"
                    style="cursor: pointer; background: ${rowBg};"
                  >
                    <td style="font-family: monospace; font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${formatTs(log.timestamp)}</td>
                    <td>
                      <span class="badge" style="background: ${LEVEL_BG[log.level]}; color: ${LEVEL_TEXT[log.level]}; font-size: 10px;">${log.level}</span>
                    </td>
                    <td style="font-size: 12px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${log.service}</td>
                    <td style="font-size: 11px; font-family: monospace; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${log.merchantId}</td>
                    <td>
                      <div style="font-size: 12px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${log.message}</div>
                      ${isExpanded && log.metadata ? `
                        <div style="
                          margin-top: 8px;
                          background: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 6px;
                          padding: 10px;
                          font-family: monospace;
                          font-size: 11px;
                          color: #475569;
                          white-space: pre-wrap;
                          word-break: break-word;
                        ">${JSON.stringify(log.metadata, null, 2)}</div>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer: count + pagination -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px;">
          <div style="font-size: 12px; color: #64748b;">
            Showing <strong>${Math.min((localState.page) * PAGE_SIZE + 1, totalCount)}–${Math.min((localState.page + 1) * PAGE_SIZE, totalCount)}</strong> of <strong>${totalCount}</strong> entries
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-ghost" id="log-prev-btn" style="font-size: 12px; padding: 6px 12px;" ${localState.page === 0 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>
              ← Prev
            </button>
            <span style="font-size: 12px; color: #64748b;">Page ${localState.page + 1} of ${Math.max(totalPages, 1)}</span>
            <button class="btn btn-ghost" id="log-next-btn" style="font-size: 12px; padding: 6px 12px;" ${localState.page >= totalPages - 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>
              Next →
            </button>
          </div>
        </div>

      </div>
    `;

    // ── Attach event handlers ──

    // Level pill buttons
    container.querySelectorAll<HTMLButtonElement>('[data-level-pill]').forEach(btn => {
      btn.addEventListener('click', () => {
        localState.levelFilter = btn.dataset.levelPill as string;
        localState.page = 0;
        build();
      });
    });

    // Service filter
    container.querySelector<HTMLSelectElement>('#log-service-filter')?.addEventListener('change', e => {
      localState.serviceFilter = (e.target as HTMLSelectElement).value;
      localState.page = 0;
      build();
    });

    // Search input (debounced)
    let searchTimeout: ReturnType<typeof setTimeout>;
    container.querySelector<HTMLInputElement>('#log-search')?.addEventListener('input', e => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        localState.searchQuery = (e.target as HTMLInputElement).value;
        localState.page = 0;
        build();
      }, 250);
    });

    // Clear
    container.querySelector('#log-clear-btn')?.addEventListener('click', () => {
      localState.levelFilter = '';
      localState.serviceFilter = '';
      localState.searchQuery = '';
      localState.page = 0;
      build();
    });

    // Row expand
    container.querySelectorAll<HTMLTableRowElement>('tr[data-log-id]').forEach(row => {
      row.addEventListener('click', () => {
        const logId = row.dataset.logId!;
        localState.expandedId = localState.expandedId === logId ? null : logId;
        build();
      });
    });

    // Prev/Next
    container.querySelector('#log-prev-btn')?.addEventListener('click', () => {
      if (localState.page > 0) { localState.page--; build(); }
    });
    container.querySelector('#log-next-btn')?.addEventListener('click', () => {
      const total = Math.ceil(getFilteredLogs().length / PAGE_SIZE);
      if (localState.page < total - 1) { localState.page++; build(); }
    });

    // Clear merchant filter shortcut
    container.querySelector('#clear-merchant-filter')?.addEventListener('click', () => {
      // Does not touch store merchant — just removes it from view
      store.setState({ activeMerchantId: null, editingConfig: null, isDirty: false });
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
