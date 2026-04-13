/**
 * Mock API service layer — wraps all data access behind async functions.
 * Simulates network latency with a small artificial delay.
 * To wire up a real backend: replace the function bodies only; signatures stay the same.
 */
import {
  MOCK_TENANTS,
  MOCK_MERCHANTS,
  MOCK_LOGS,
  getMerchantsForTenant,
  getMerchantById,
  getLogsForMerchant,
  getAnalyticsForMerchant,
  createDefaultMerchantConfig,
  type Tenant,
  type Merchant,
  type MerchantConfig,
  type LogEntry,
  type AnalyticsMetric,
} from '../data/mock';

const SIMULATED_DELAY_MS = 180;

function delay(ms = SIMULATED_DELAY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getTenants(): Promise<Tenant[]> {
  await delay();
  return [...MOCK_TENANTS];
}

export async function getMerchants(tenantId: string): Promise<Merchant[]> {
  await delay();
  return getMerchantsForTenant(tenantId);
}

export async function getMerchantConfig(merchantId: string): Promise<MerchantConfig | null> {
  await delay();
  const merchant = getMerchantById(merchantId);
  return merchant ? JSON.parse(JSON.stringify(merchant.config)) : null;
}

export async function saveOverlay(merchantId: string, config: MerchantConfig): Promise<void> {
  await delay(80);
  // POC: persist to localStorage as a stand-in for a DB write
  const key = `apay-overlay-${merchantId}`;
  localStorage.setItem(key, JSON.stringify(config));
}

export async function getLogs(merchantId?: string): Promise<LogEntry[]> {
  await delay();
  const logs = merchantId ? getLogsForMerchant(merchantId) : [...MOCK_LOGS];
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAnalytics(merchantId: string): Promise<AnalyticsMetric[]> {
  await delay();
  return getAnalyticsForMerchant(merchantId);
}

export async function createMerchant(id: string, tenantId: string, name: string): Promise<Merchant> {
  await delay(120);
  const config = createDefaultMerchantConfig(id, tenantId, name);
  const merchant: Merchant = {
    id,
    tenantId,
    name,
    status: 'active',
    lastUpdated: new Date().toISOString(),
    config,
  };
  MOCK_MERCHANTS.push(merchant);
  // Update tenant merchant count
  const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
  if (tenant) tenant.merchantCount += 1;
  return merchant;
}
