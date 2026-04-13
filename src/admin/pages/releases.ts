import { SCHEMA_RELEASES, LATEST_VERSION, getReleasesBetween, type SchemaRelease, type ChangelogType, type AreaType } from '../data/releases';
import { MOCK_GITHUB_RELEASES, GITHUB_REPO } from '../data/githubReleases';
import { getMigrationPlan, applyMigration, generateAiAnalysis, type MigrationPlan, type AiAnalysis } from '../services/migration';
import { MOCK_MERCHANTS, MOCK_TENANTS } from '../data/mock';
import { store } from '../services/store';

const CHANGELOG_BG: Record<ChangelogType, string> = { added: '#dcfce7', changed: '#fef3c7', deprecated: '#fee2e2' };
const CHANGELOG_TEXT: Record<ChangelogType, string> = { added: '#15803d', changed: '#b45309', deprecated: '#b91c1c' };
const AREA_BG: Record<AreaType, string> = { pages: '#dbeafe', integrations: '#ede9fe', theme: '#fce7f3', navigation: '#f0f9ff', components: '#f1f5f9' };
const AREA_TEXT: Record<AreaType, string> = { pages: '#1d4ed8', integrations: '#6d28d9', theme: '#9d174d', navigation: '#0369a1', components: '#475569' };
const CONF_BG: Record<string, string> = { high: '#dcfce7', medium: '#fef3c7', low: '#f1f5f9' };
const CONF_TEXT: Record<string, string> = { high: '#15803d', medium: '#b45309', low: '#475569' };

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

function versionsBehind(current: string, latest: string): number {
  const versions = SCHEMA_RELEASES.map(r => r.version);
  const ci = versions.indexOf(current);
  const li = versions.indexOf(latest);
  if (ci === -1 || li === -1) return 0;
  return Math.max(0, li - ci);
}

export function renderReleases(container: HTMLElement): void {
  let selectedVersions: string[] = [LATEST_VERSION];
  let compareMode = false;
  let activeTab: 'detail' | 'migrations' = 'detail';

  // Migration panel state
  let migratingMerchantId: string | null = null;
  let migrationPlan: MigrationPlan | null = null;
  let fieldValues: Record<string, any> = {};
  let aiAnalysis: AiAnalysis | null = null;
  let aiLoading = false;

  function build() {
    const vA = selectedVersions[0];
    const vB = selectedVersions[1];
    const releaseA = SCHEMA_RELEASES.find(r => r.version === vA);
    const releaseB = vB ? SCHEMA_RELEASES.find(r => r.version === vB) : undefined;

    container.innerHTML = `
      <div class="page-enter" style="display: flex; height: calc(100vh - 60px); overflow: hidden;">

        <!-- LEFT: Release Timeline (280px) -->
        <div style="
          width: 280px; flex-shrink: 0;
          border-right: 1px solid #e8edf3;
          background: #f8fafc;
          display: flex; flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="padding: 20px 18px 12px; border-bottom: 1px solid #e8edf3; flex-shrink: 0;">
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 4px;">Schema Releases</div>
            <div style="font-size: 11px; color: #94a3b8;">Select one or two versions to compare</div>
            <div style="margin-top: 12px; display: flex; border: 1px solid #e2e8f0; border-radius: 7px; overflow: hidden;">
              <button id="mode-detail" style="flex: 1; padding: 6px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; background: ${!compareMode ? '#0f172a' : 'white'}; color: ${!compareMode ? 'white' : '#64748b'};">Detail</button>
              <button id="mode-compare" style="flex: 1; padding: 6px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; border: none; background: ${compareMode ? '#0f172a' : 'white'}; color: ${compareMode ? 'white' : '#64748b'};">Compare</button>
            </div>
          </div>

          <!-- Release list -->
          <div style="flex: 1; overflow-y: auto; padding: 12px 10px;">
            ${[...SCHEMA_RELEASES].reverse().map((r, idx) => {
              const isLatest = r.version === LATEST_VERSION;
              const isSelected = selectedVersions.includes(r.version);
              const selIdx = selectedVersions.indexOf(r.version);
              const addedCount = r.changelog.filter(c => c.type === 'added').length;
              const changedCount = r.changelog.filter(c => c.type === 'changed').length;
              const deprCount = r.changelog.filter(c => c.type === 'deprecated').length;

              return `
                <div data-release-version="${r.version}" style="
                  padding: 12px 12px;
                  border-radius: 10px; margin-bottom: 6px; cursor: pointer;
                  border: 1.5px solid ${isSelected ? '#3b82f6' : 'transparent'};
                  background: ${isSelected ? '#eff6ff' : 'white'};
                  box-shadow: ${isSelected ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 1px 3px rgba(15,23,42,0.04)'};
                  transition: all 0.15s;
                ">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="
                      background: ${isLatest ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : idx === 0 ? '#dbeafe' : '#f1f5f9'};
                      color: ${isLatest ? 'white' : idx === 0 ? '#1d4ed8' : '#475569'};
                      font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 99px;
                      font-family: monospace; letter-spacing: 0.02em;
                    ">v${r.version}</span>
                    ${isLatest ? '<span style="font-size: 9px; font-weight: 700; color: #15803d; background: #dcfce7; border-radius: 99px; padding: 1px 6px; border: 1px solid #86efac;">CURRENT</span>' : ''}
                    ${compareMode && isSelected ? `<span style="margin-left: auto; font-size: 9px; font-weight: 700; color: #2563eb; background: #dbeafe; border-radius: 99px; padding: 1px 6px;">${selIdx === 0 ? 'A' : 'B'}</span>` : ''}
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 3px;">${r.title}</div>
                  <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">${new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${addedCount > 0 ? `<span style="font-size: 10px; background: #dcfce7; color: #15803d; border-radius: 4px; padding: 1px 6px;">+${addedCount} added</span>` : ''}
                    ${changedCount > 0 ? `<span style="font-size: 10px; background: #fef3c7; color: #b45309; border-radius: 4px; padding: 1px 6px;">~${changedCount} changed</span>` : ''}
                    ${deprCount > 0 ? `<span style="font-size: 10px; background: #fee2e2; color: #b91c1c; border-radius: 4px; padding: 1px 6px;">-${deprCount} deprecated</span>` : ''}
                    ${r.migrations.length > 0 ? `<span style="font-size: 10px; background: #f1f5f9; color: #475569; border-radius: 4px; padding: 1px 6px;">${r.migrations.length} fields</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- RIGHT: Main panel -->
        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: white;">

          <!-- GitHub sync status -->
          ${(() => {
            const latest = MOCK_GITHUB_RELEASES.filter(r => !r.draft && !r.prerelease).at(-1);
            const latestDate = latest ? new Date(latest.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            const latestUrl = latest?.html_url ?? '#';
            return `
              <div style="
                padding: 7px 20px; border-bottom: 1px solid #e8edf3;
                background: #f8fafc; display: flex; align-items: center; gap: 8px;
                font-size: 11px; color: #64748b; flex-shrink: 0;
              ">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="color:#374151;flex-shrink:0;">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Synced from GitHub</span>
                <span style="color:#cbd5e1;">·</span>
                <a href="${latestUrl}" target="_blank" rel="noopener" style="color:#3b82f6;text-decoration:none;font-weight:600;">${GITHUB_REPO}</a>
                <span style="color:#cbd5e1;">·</span>
                <span>Latest release: <strong style="color:#374151;">${latestDate}</strong></span>
                <a href="${latestUrl}" target="_blank" rel="noopener" style="margin-left:2px;color:#94a3b8;text-decoration:none;display:flex;align-items:center;" title="View on GitHub">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            `;
          })()}

          <!-- Tab bar -->
          <div style="border-bottom: 1px solid #e8edf3; padding: 0 24px; display: flex; align-items: center; gap: 0; flex-shrink: 0;">
            <button class="tab ${activeTab === 'detail' ? 'active' : ''}" data-panel-tab="detail">
              ${compareMode ? 'Comparison' : 'Release Detail'}
            </button>
            <button class="tab ${activeTab === 'migrations' ? 'active' : ''}" data-panel-tab="migrations">
              Migration Center
              <span style="background: #dbeafe; color: #1d4ed8; border-radius: 10px; font-size: 10px; padding: 1px 6px; margin-left: 4px;">
                ${MOCK_MERCHANTS.filter(m => semverCompare(m.config.version ?? '1.0.0', LATEST_VERSION) < 0).length} pending
              </span>
            </button>
          </div>

          <!-- Tab content -->
          <div style="flex: 1; overflow-y: auto;">
            ${activeTab === 'detail' ? renderDetailPanel(compareMode, releaseA, releaseB) : renderMigrationsPanel()}
          </div>
        </div>

      </div>
    `;

    // Mode toggle
    container.querySelector('#mode-detail')?.addEventListener('click', () => { compareMode = false; selectedVersions = [selectedVersions[0]]; build(); });
    container.querySelector('#mode-compare')?.addEventListener('click', () => { compareMode = true; build(); });

    // Tab switching
    container.querySelectorAll<HTMLButtonElement>('[data-panel-tab]').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.panelTab as 'detail' | 'migrations'; build(); });
    });

    // Release selection
    container.querySelectorAll<HTMLElement>('[data-release-version]').forEach(el => {
      el.addEventListener('click', () => {
        const v = el.dataset.releaseVersion!;
        if (!compareMode) {
          selectedVersions = [v];
        } else {
          if (selectedVersions.includes(v)) {
            selectedVersions = selectedVersions.filter(sv => sv !== v);
          } else if (selectedVersions.length < 2) {
            selectedVersions = [...selectedVersions, v];
          } else {
            selectedVersions = [selectedVersions[1], v];
          }
        }
        build();
      });
    });

    // Migrate buttons
    container.querySelectorAll<HTMLButtonElement>('[data-migrate-merchant]').forEach(btn => {
      btn.addEventListener('click', () => {
        const merchantId = btn.dataset.migrateMerchant!;
        const merchant = MOCK_MERCHANTS.find(m => m.id === merchantId);
        if (!merchant) return;
        migratingMerchantId = merchantId;
        const config = store.getState().activeMerchantId === merchantId && store.getState().editingConfig
          ? store.getState().editingConfig!
          : merchant.config;
        migrationPlan = getMigrationPlan(config);
        fieldValues = Object.fromEntries(migrationPlan.fields.map(f => [f.id, f.proposedValue]));
        aiAnalysis = null;
        aiLoading = false;
        activeTab = 'migrations';
        build();
      });
    });

    // Cancel migration
    container.querySelector('#cancel-migration-btn')?.addEventListener('click', () => {
      migratingMerchantId = null;
      migrationPlan = null;
      fieldValues = {};
      aiAnalysis = null;
      build();
    });

    // Field value changes in migration panel
    container.querySelectorAll<HTMLInputElement>('[data-field-id]').forEach(input => {
      const handler = () => {
        const id = input.dataset.fieldId!;
        if (input.type === 'checkbox') {
          fieldValues[id] = input.checked;
        } else if (input.type === 'number') {
          fieldValues[id] = parseFloat(input.value) || 0;
        } else {
          fieldValues[id] = input.value;
        }
      };
      input.addEventListener('change', handler);
      input.addEventListener('input', handler);
    });

    // AI analysis button
    container.querySelector('#ai-analyze-btn')?.addEventListener('click', async () => {
      if (!migrationPlan || !migratingMerchantId) return;
      const merchant = MOCK_MERCHANTS.find(m => m.id === migratingMerchantId);
      if (!merchant) return;
      aiLoading = true;
      aiAnalysis = null;
      build();
      const config = store.getState().activeMerchantId === migratingMerchantId && store.getState().editingConfig
        ? store.getState().editingConfig!
        : merchant.config;
      const result = await generateAiAnalysis(config, migrationPlan);
      aiAnalysis = result;
      aiLoading = false;
      build();
    });

    // Apply individual AI suggestion
    container.querySelectorAll<HTMLButtonElement>('[data-apply-suggestion]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fieldId = btn.dataset.applySuggestion!;
        const suggestion = aiAnalysis?.fieldSuggestions.find(s => s.fieldId === fieldId);
        if (!suggestion) return;
        fieldValues[fieldId] = suggestion.suggestedValue;
        // Update the corresponding input
        const input = container.querySelector<HTMLInputElement>(`[data-field-id="${fieldId}"]`);
        if (input) {
          if (input.type === 'checkbox') input.checked = Boolean(suggestion.suggestedValue);
          else input.value = String(suggestion.suggestedValue);
        }
      });
    });

    // Apply all high-confidence
    container.querySelector('#apply-high-conf-btn')?.addEventListener('click', () => {
      if (!aiAnalysis) return;
      aiAnalysis.fieldSuggestions.filter(s => s.confidence === 'high').forEach(s => {
        fieldValues[s.fieldId] = s.suggestedValue;
      });
      build();
    });

    // Apply & Publish migration
    container.querySelector('#apply-migration-btn')?.addEventListener('click', () => {
      if (!migrationPlan || !migratingMerchantId) return;
      const merchant = MOCK_MERCHANTS.find(m => m.id === migratingMerchantId);
      if (!merchant) return;
      const config = store.getState().activeMerchantId === migratingMerchantId && store.getState().editingConfig
        ? store.getState().editingConfig!
        : merchant.config;
      const migratedConfig = applyMigration(config, fieldValues);
      merchant.config = migratedConfig;
      store.setState({
        editingConfig: migratedConfig,
        activeMerchantId: migratingMerchantId,
        isDirty: false,
      });
      store.ensureBaselineVersion(migratingMerchantId, migratedConfig);
      store.publishConfig(migratingMerchantId);
      migratingMerchantId = null;
      migrationPlan = null;
      fieldValues = {};
      aiAnalysis = null;
      build();
    });
  }

  // ── Render: Detail / Compare panel ──────────────────────────────────────────

  function renderDetailPanel(comparing: boolean, relA?: SchemaRelease, relB?: SchemaRelease): string {
    if (!relA) {
      return `<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#94a3b8;font-size:13px;">Select a release from the timeline.</div>`;
    }

    if (comparing && relB) {
      // Compare two releases
      const versions = SCHEMA_RELEASES.map(r => r.version);
      const aIdx = versions.indexOf(relA.version);
      const bIdx = versions.indexOf(relB.version);
      const [earlier, later] = aIdx < bIdx ? [relA, relB] : [relB, relA];
      const introduced = getReleasesBetween(earlier.version, later.version);
      const allNewItems = introduced.flatMap(r => r.changelog.map(c => ({ ...c, inVersion: r.version })));

      return `
        <div style="padding: 28px 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 14px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 7px;">v${earlier.version}</span>
            <span style="color: #94a3b8; font-size: 16px;">→</span>
            <span style="font-family: monospace; font-size: 14px; font-weight: 700; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 7px;">v${later.version}</span>
            <span style="font-size: 12px; color: #94a3b8; margin-left: 8px;">${allNewItems.length} change${allNewItems.length !== 1 ? 's' : ''} across ${introduced.length} release${introduced.length !== 1 ? 's' : ''}</span>
          </div>

          ${introduced.map(rel => `
            <div style="margin-bottom: 28px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
                <span style="font-family: monospace; font-size: 12px; font-weight: 700; background: #f8fafc; color: #475569; padding: 3px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">v${rel.version}</span>
                <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${rel.title}</span>
                <span style="font-size: 11px; color: #94a3b8;">${new Date(rel.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
              ${renderChangelogItems(rel.changelog)}
            </div>
          `).join('')}

          ${allNewItems.length === 0 ? `
            <div style="text-align:center;padding:40px;color:#94a3b8;">These versions are the same or no changes were recorded between them.</div>
          ` : ''}
        </div>
      `;
    }

    // Single release detail
    return `
      <div style="padding: 28px 32px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #0f172a;">v${relA.version}</span>
              ${relA.version === LATEST_VERSION ? '<span style="background: linear-gradient(135deg,#3b82f6,#1d4ed8); color: white; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px;">CURRENT</span>' : ''}
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 6px;">${relA.title}</div>
            <div style="font-size: 12px; color: #94a3b8;">${new Date(relA.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style="display: flex; gap: 8px; flex-shrink: 0;">
            <div style="text-align: center; background: #dcfce7; border-radius: 10px; padding: 10px 16px;">
              <div style="font-size: 20px; font-weight: 800; color: #15803d;">${relA.changelog.filter(c => c.type === 'added').length}</div>
              <div style="font-size: 10px; color: #15803d; font-weight: 600; text-transform: uppercase;">Added</div>
            </div>
            <div style="text-align: center; background: #fef3c7; border-radius: 10px; padding: 10px 16px;">
              <div style="font-size: 20px; font-weight: 800; color: #b45309;">${relA.changelog.filter(c => c.type === 'changed').length}</div>
              <div style="font-size: 10px; color: #b45309; font-weight: 600; text-transform: uppercase;">Changed</div>
            </div>
            <div style="text-align: center; background: #fee2e2; border-radius: 10px; padding: 10px 16px;">
              <div style="font-size: 20px; font-weight: 800; color: #b91c1c;">${relA.changelog.filter(c => c.type === 'deprecated').length}</div>
              <div style="font-size: 10px; color: #b91c1c; font-weight: 600; text-transform: uppercase;">Deprecated</div>
            </div>
          </div>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px; max-width: 640px;">${relA.description}</p>

        ${relA.changelog.length > 0 ? `
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Changelog</div>
          ${renderChangelogItems(relA.changelog)}
        ` : '<div style="color:#94a3b8;font-size:13px;">No changelog entries for this release.</div>'}

        ${relA.migrations.length > 0 ? `
          <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Migration Fields (${relA.migrations.length})</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${relA.migrations.map(f => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 12px; font-weight: 700; color: #374151;">${f.title}</span>
                    <span style="font-size: 10px; background: #f1f5f9; color: #64748b; border-radius: 4px; padding: 1px 6px; font-family: monospace;">${f.inputType}</span>
                    ${f.required ? '<span style="font-size: 10px; background: #fee2e2; color: #b91c1c; border-radius: 4px; padding: 1px 6px;">required</span>' : ''}
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${f.description}</div>
                  <div style="font-size: 10px; font-family: monospace; color: #94a3b8;">${f.path}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderChangelogItems(items: SchemaRelease['changelog']): string {
    const grouped: Record<string, typeof items> = { added: [], changed: [], deprecated: [] };
    items.forEach(item => { (grouped[item.type] = grouped[item.type] ?? []).push(item); });
    return ['added', 'changed', 'deprecated']
      .filter(type => (grouped[type]?.length ?? 0) > 0)
      .map(type => `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${CHANGELOG_BG[type as ChangelogType]}; color: ${CHANGELOG_TEXT[type as ChangelogType]}; font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 99px; text-transform: capitalize;">${type}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px; padding-left: 8px; border-left: 2px solid ${CHANGELOG_BG[type as ChangelogType]};">
            ${(grouped[type] ?? []).map(item => `
              <div style="display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; background: white; border: 1px solid #f1f5f9; border-radius: 6px;">
                <span class="badge" style="background: ${AREA_BG[item.area]}; color: ${AREA_TEXT[item.area]}; font-size: 9px; flex-shrink: 0; margin-top: 1px;">${item.area}</span>
                <span style="font-size: 12px; color: #374151; line-height: 1.4;">${item.description}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
  }

  // ── Render: Migration Center panel ──────────────────────────────────────────

  function renderMigrationsPanel(): string {
    if (migratingMerchantId && migrationPlan) {
      return renderMigrationPanel(migrationPlan);
    }

    const tenantById: Record<string, string> = {};
    MOCK_TENANTS.forEach(t => { tenantById[t.id] = t.name; });

    const merchants = MOCK_MERCHANTS.map(m => ({
      ...m,
      configVersion: m.config.version ?? '1.0.0',
      behind: versionsBehind(m.config.version ?? '1.0.0', LATEST_VERSION),
    })).sort((a, b) => b.behind - a.behind);

    return `
      <div style="padding: 28px 32px;">
        <div style="margin-bottom: 24px;">
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 6px;">Migration Center</div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; max-width: 600px;">
            Merchants whose config is behind the current schema release (v${LATEST_VERSION}) need migration to gain access to new features.
            The AI assistant will analyze each merchant's existing config and suggest appropriate values.
          </p>
        </div>

        <!-- Summary stats -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          ${[
            { label: 'Up to date', v: merchants.filter(m => m.behind === 0).length, bg: '#dcfce7', color: '#15803d' },
            { label: '1 version behind', v: merchants.filter(m => m.behind === 1).length, bg: '#fef3c7', color: '#b45309' },
            { label: '2+ versions behind', v: merchants.filter(m => m.behind >= 2).length, bg: '#fee2e2', color: '#b91c1c' },
          ].map(s => `
            <div style="background: ${s.bg}; border-radius: 10px; padding: 14px 18px; text-align: center;">
              <div style="font-size: 26px; font-weight: 800; color: ${s.color}; letter-spacing: -0.5px;">${s.v}</div>
              <div style="font-size: 11px; color: ${s.color}; font-weight: 600; margin-top: 2px;">${s.label}</div>
            </div>
          `).join('')}
        </div>

        <!-- Merchant table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Tenant</th>
                <th style="text-align: center;">Current</th>
                <th style="text-align: center;">Target</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${merchants.map((m, i) => {
                const statusBg = m.behind === 0 ? '#dcfce7' : m.behind === 1 ? '#fef3c7' : '#fee2e2';
                const statusColor = m.behind === 0 ? '#15803d' : m.behind === 1 ? '#b45309' : '#b91c1c';
                const statusLabel = m.behind === 0 ? 'Up to date' : m.behind === 1 ? '1 behind' : `${m.behind} behind`;
                const rowBg = i % 2 === 0 ? '#ffffff' : '#fafafa';
                return `
                  <tr style="background: ${rowBg};">
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0; background: linear-gradient(135deg, ${m.config.merchant.theme.primaryColor}, ${m.config.merchant.theme.secondaryColor});"></div>
                        <div>
                          <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${m.name}</div>
                          <div style="font-size: 10px; font-family: monospace; color: #94a3b8;">${m.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size: 12px; color: #64748b;">${tenantById[m.tenantId] ?? m.tenantId}</td>
                    <td style="text-align: center;">
                      <span style="font-family: monospace; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 5px;">v${m.configVersion}</span>
                    </td>
                    <td style="text-align: center;">
                      <span style="font-family: monospace; font-size: 11px; font-weight: 700; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 5px;">v${LATEST_VERSION}</span>
                    </td>
                    <td style="text-align: center;">
                      <span style="background: ${statusBg}; color: ${statusColor}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px;">${statusLabel}</span>
                    </td>
                    <td style="text-align: right;">
                      ${m.behind > 0 ? `
                        <button class="btn btn-primary" data-migrate-merchant="${m.id}" style="font-size: 11px; padding: 5px 12px;">Migrate →</button>
                      ` : `
                        <span style="font-size: 11px; color: #94a3b8;">—</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderMigrationPanel(plan: MigrationPlan): string {
    return `
      <div style="padding: 28px 32px;">

        <!-- Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <button id="cancel-migration-btn" class="btn btn-ghost" style="font-size: 12px; padding: 5px 10px;">← Back</button>
              <span style="color: #cbd5e1;">|</span>
              <span style="font-size: 14px; font-weight: 800; color: #0f172a;">Migrating ${plan.merchantName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 0;">
              <span style="font-family: monospace; font-size: 12px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 6px;">v${plan.fromVersion}</span>
              <span style="color: #94a3b8;">→</span>
              <span style="font-family: monospace; font-size: 12px; font-weight: 700; background: #dbeafe; color: #1d4ed8; padding: 3px 10px; border-radius: 6px;">v${plan.toVersion}</span>
              <span style="font-size: 11px; color: #94a3b8;">${plan.fields.length} field${plan.fields.length !== 1 ? 's' : ''} to configure</span>
            </div>
          </div>
          <button class="btn btn-primary" id="apply-migration-btn" style="padding: 9px 18px; font-size: 13px; flex-shrink: 0;">Apply & Publish</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start;">

          <!-- Left: Field list -->
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Fields to Configure</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${plan.fields.map(field => {
                const suggestion = aiAnalysis?.fieldSuggestions.find(s => s.fieldId === field.id);
                const currentFieldValue = fieldValues[field.id] ?? field.defaultValue;
                return `
                  <div style="
                    background: white; border: 1.5px solid ${suggestion ? CONF_BG[suggestion.confidence] : '#e2e8f0'};
                    border-radius: 10px; padding: 14px 16px;
                  ">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${field.title}</span>
                          ${field.required ? '<span style="font-size: 10px; background: #fee2e2; color: #b91c1c; border-radius: 4px; padding: 1px 6px;">required</span>' : ''}
                          ${!field.hasValue ? '<span style="font-size: 10px; background: #dbeafe; color: #1d4ed8; border-radius: 4px; padding: 1px 6px;">new field</span>' : ''}
                          ${suggestion ? `<span style="font-size: 10px; background: ${CONF_BG[suggestion.confidence]}; color: ${CONF_TEXT[suggestion.confidence]}; border-radius: 4px; padding: 1px 6px; font-weight: 700;">${suggestion.confidence} confidence</span>` : ''}
                        </div>
                        <div style="font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 6px;">${field.description}</div>
                        <div style="font-size: 10px; font-family: monospace; color: #94a3b8; margin-bottom: 10px;">${field.path}</div>
                      </div>
                      ${suggestion ? `
                        <button class="btn btn-ghost" data-apply-suggestion="${field.id}" style="font-size: 11px; padding: 4px 10px; flex-shrink: 0; border-color: ${CONF_BG[suggestion.confidence]}; color: ${CONF_TEXT[suggestion.confidence]};">
                          Apply AI
                        </button>
                      ` : ''}
                    </div>
                    <!-- Input -->
                    ${field.inputType === 'boolean' ? `
                      <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <label class="toggle-switch">
                          <input type="checkbox" data-field-id="${field.id}" ${currentFieldValue ? 'checked' : ''}>
                          <span class="toggle-slider"></span>
                        </label>
                        <span style="font-size: 12px; color: #374151; font-weight: 500;">${currentFieldValue ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ` : field.inputType === 'number' ? `
                      <input type="number" class="form-input" data-field-id="${field.id}" value="${currentFieldValue}" style="max-width: 140px; font-size: 12px;">
                    ` : `
                      <input type="text" class="form-input" data-field-id="${field.id}" value="${Array.isArray(currentFieldValue) ? currentFieldValue.join(', ') : String(currentFieldValue ?? '')}" placeholder="${field.defaultValue}" style="font-size: 12px; font-family: monospace;">
                    `}
                    <!-- AI rationale -->
                    ${suggestion ? `
                      <div style="margin-top: 10px; padding: 8px 10px; background: ${CONF_BG[suggestion.confidence]}22; border-left: 3px solid ${CONF_BG[suggestion.confidence]}; border-radius: 0 6px 6px 0; font-size: 11px; color: #475569; line-height: 1.4;">
                        ${suggestion.rationale}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Right: AI Assistant -->
          <div style="position: sticky; top: 24px;">
            <div style="
              background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
              border-radius: 14px; padding: 20px;
              box-shadow: 0 8px 32px rgba(15,23,42,0.2);
            ">
              <!-- Header -->
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                <div style="
                  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
                  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                  display: flex; align-items: center; justify-content: center;
                  font-size: 16px; box-shadow: 0 4px 12px rgba(59,130,246,0.4);
                ">✦</div>
                <div>
                  <div style="color: #f1f5f9; font-size: 13px; font-weight: 700; line-height: 1.2;">AI Migration Assistant</div>
                  <div style="color: #475569; font-size: 10px; margin-top: 2px;">Powered by simulated analysis</div>
                </div>
              </div>

              ${aiLoading ? `
                <!-- Loading state -->
                <div style="text-align: center; padding: 24px 0;">
                  <div style="
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    color: #94a3b8; font-size: 12px; margin-bottom: 12px;
                  ">
                    <span id="ai-dots" style="font-size: 18px; letter-spacing: 4px; color: #3b82f6;">•••</span>
                  </div>
                  <div style="color: #64748b; font-size: 12px; line-height: 1.5;">
                    Analyzing <strong style="color:#94a3b8;">${plan.merchantName}</strong>'s configuration…<br>
                    Reviewing integrations, theme, and page structure.
                  </div>
                </div>
              ` : aiAnalysis ? `
                <!-- Analysis result -->
                <div style="
                  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                  border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;
                ">
                  <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Analysis</div>
                  <p style="font-size: 12px; color: #cbd5e1; line-height: 1.6; margin: 0;">${aiAnalysis.summary}</p>
                </div>

                <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">${aiAnalysis.fieldSuggestions.length} suggestions</div>

                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
                  ${aiAnalysis.fieldSuggestions.map(s => {
                    const field = plan.fields.find(f => f.id === s.fieldId);
                    return `
                      <div style="
                        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 7px; padding: 9px 11px;
                      ">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                          <span style="font-size: 11px; font-weight: 600; color: #e2e8f0;">${field?.title ?? s.fieldId}</span>
                          <span style="font-size: 9px; background: ${CONF_BG[s.confidence]}33; color: ${CONF_BG[s.confidence]}; border-radius: 99px; padding: 1px 7px; font-weight: 700; border: 1px solid ${CONF_BG[s.confidence]}44;">${s.confidence}</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-bottom: 4px;">→ ${JSON.stringify(s.suggestedValue)}</div>
                      </div>
                    `;
                  }).join('')}
                </div>

                ${aiAnalysis.fieldSuggestions.filter(s => s.confidence === 'high').length > 0 ? `
                  <button class="btn btn-primary" id="apply-high-conf-btn" style="width: 100%; font-size: 12px; padding: 9px; margin-bottom: 8px;">
                    Apply ${aiAnalysis.fieldSuggestions.filter(s => s.confidence === 'high').length} High-Confidence Suggestions
                  </button>
                ` : ''}
                <button class="btn btn-ghost" id="ai-analyze-btn" style="width: 100%; font-size: 12px; padding: 7px; color: #64748b; border-color: rgba(255,255,255,0.1);">Re-analyze</button>
              ` : `
                <!-- Idle state -->
                <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                  Let the AI analyze ${plan.merchantName}'s existing configuration and suggest values for each new field — with confidence ratings and rationale.
                </p>
                <button class="btn btn-primary" id="ai-analyze-btn" style="width: 100%; font-size: 13px; padding: 10px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); box-shadow: 0 4px 14px rgba(59,130,246,0.35);">
                  ✦ Analyze with AI
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  build();

  const unsub = store.subscribe(() => build());
  const observer = new MutationObserver(() => {
    if (!document.contains(container)) { unsub(); observer.disconnect(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
