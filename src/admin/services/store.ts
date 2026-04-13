import { CURRENT_STACK_ID } from '../config';
import type { MerchantConfig } from '../data/mock';
import { MOCK_LOGS } from '../data/mock';

export interface ConfigVersion {
  id: string;
  timestamp: string;
  label: string;
  config: MerchantConfig;
  isActive: boolean;
}

export interface AppState {
  activeStackId: string;
  activeTenantId: string;
  activeMerchantId: string | null;
  currentRoute: string;
  editingConfig: MerchantConfig | null;
  isDirty: boolean;
  configVersions: Record<string, ConfigVersion[]>;
}


class Store {
  private state: AppState = {
    activeStackId: CURRENT_STACK_ID,
    // activeTenantId: defaultTenantId,
    activeTenantId: 'all',
    activeMerchantId: null,
    currentRoute: '#/dashboard',
    editingConfig: null,
    isDirty: false,
    configVersions: {},
  };

  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  setState(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  getState(): AppState {
    return this.state;
  }

  getActiveVersion(merchantId: string): ConfigVersion | null {
    const versions = this.state.configVersions[merchantId] ?? [];
    return versions.find((v) => v.isActive) ?? null;
  }

  getVersions(merchantId: string): ConfigVersion[] {
    return this.state.configVersions[merchantId] ?? [];
  }

  // Called when a merchant config is first loaded — seeds a baseline version if none exists
  ensureBaselineVersion(merchantId: string, config: MerchantConfig) {
    if (this.state.configVersions[merchantId]) return;
    const baseline: ConfigVersion = {
      id: `v_${merchantId}_baseline`,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      label: 'v1.0.0 — Initial config',
      config: JSON.parse(JSON.stringify(config)),
      isActive: true,
    };
    // Silent update — no notify, called during render init
    this.state = {
      ...this.state,
      configVersions: { ...this.state.configVersions, [merchantId]: [baseline] },
    };
  }

  publishConfig(merchantId: string) {
    const config = this.state.editingConfig;
    if (!config) return;

    const existing = this.state.configVersions[merchantId] ?? [];
    const versionNum = existing.length + 1;
    const newVersion: ConfigVersion = {
      id: `v_${merchantId}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: `v1.${versionNum}.0 — Published`,
      config: JSON.parse(JSON.stringify(config)),
      isActive: true,
    };

    const updated = existing.map((v) => ({ ...v, isActive: false }));
    updated.push(newVersion);

    MOCK_LOGS.unshift({
      id: `log_cfg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'config-service',
      merchantId,
      tenantId: config.merchant.tenantId,
      message: `Config published for ${config.merchant.name}`,
      metadata: { merchantId, tenantId: config.merchant.tenantId, versionId: newVersion.id, label: newVersion.label },
    });

    this.setState({
      configVersions: { ...this.state.configVersions, [merchantId]: updated },
      isDirty: false,
    });
  }

  rollbackTo(merchantId: string, versionId: string) {
    const versions = this.state.configVersions[merchantId] ?? [];
    const target = versions.find((v) => v.id === versionId);
    if (!target) return;

    const updated = versions.map((v) => ({ ...v, isActive: v.id === versionId }));

    MOCK_LOGS.unshift({
      id: `log_cfg_rb_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'config-service',
      merchantId,
      tenantId: target.config.merchant.tenantId,
      message: `Config rolled back to ${target.label}`,
      metadata: { merchantId, versionId },
    });

    this.setState({
      configVersions: { ...this.state.configVersions, [merchantId]: updated },
      editingConfig: JSON.parse(JSON.stringify(target.config)),
      isDirty: false,
    });
  }

  applyPreview() {
    if (!this.state.editingConfig) return;

    const payload = {
      source: '/admin',
      savedAt: new Date().toISOString(),
      schema: this.state.editingConfig,
    };

    // Save to tenant/merchant-specific key
    if (this.state.activeTenantId && this.state.activeMerchantId) {
      const key = `apay-schema-${this.state.activeTenantId}-${this.state.activeMerchantId}`;
      localStorage.setItem(key, JSON.stringify(payload));
    }

    // Also save to legacy keys for backward compatibility
    localStorage.setItem('apay-admin-schema', JSON.stringify(payload));
    if (this.state.activeMerchantId) {
      localStorage.setItem(`apay-preview-config-${this.state.activeMerchantId}`, JSON.stringify(this.state.editingConfig));
    }
    localStorage.setItem('apay-preview-config', JSON.stringify(this.state.editingConfig));
  }

  clearPreview() {
    if (this.state.activeTenantId && this.state.activeMerchantId) {
      const key = `apay-schema-${this.state.activeTenantId}-${this.state.activeMerchantId}`;
      localStorage.removeItem(key);
    }
    localStorage.removeItem('apay-admin-schema');
    if (this.state.activeMerchantId) {
      localStorage.removeItem(`apay-preview-config-${this.state.activeMerchantId}`);
    }
    localStorage.removeItem('apay-preview-config');
  }
}

export const store = new Store();
