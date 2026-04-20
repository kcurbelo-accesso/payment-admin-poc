export interface NginxLogEntry {
  timestamp: string; // ISO
  version: string;
  tenantId: string;
  merchantId: string;
  locale: string;
  page: string;
  status: number;
  responseMs: number;
}

// Generates a timestamp N days ago with random hour/minute
function daysAgo(days: number, hourOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

// ── Mock nginx access log entries ─────────────────────────────────────────────
// URL format: /{version}/{tenantId}/{merchantId}/{locale}/{page}
// e.g. /1.3/tenant_cedarfair/cf_001/en-US/payment
//
// Version mapping: release 1.3.0 → nginx path /1.3/, release 1.2.0 → /1.2/, etc.
// Merchant nginx version matches their config schema version (major.minor only).
export const MOCK_NGINX_LOGS: NginxLogEntry[] = [
  // v1.3 — latest release, active traffic (config 1.3.0 merchants)
  ...Array.from({ length: 30 }, (_, i) => ({
    timestamp: daysAgo(i, 9),  version: '1.3', tenantId: 'tenant_cedarfair', merchantId: 'cf_001', locale: 'en-US', page: 'payment',   status: 200, responseMs: 180,
  })),
  ...Array.from({ length: 28 }, (_, i) => ({
    timestamp: daysAgo(i, 10), version: '1.3', tenantId: 'tenant_cedarfair', merchantId: 'cf_001', locale: 'en-US', page: 'insurance', status: 200, responseMs: 145,
  })),
  ...Array.from({ length: 22 }, (_, i) => ({
    timestamp: daysAgo(i, 12), version: '1.3', tenantId: 'tenant_sixflags',  merchantId: 'sf_001', locale: 'en-US', page: 'payment',   status: 200, responseMs: 195,
  })),
  ...Array.from({ length: 18 }, (_, i) => ({
    timestamp: daysAgo(i, 13), version: '1.3', tenantId: 'tenant_sixflags',  merchantId: 'sf_001', locale: 'en-US', page: 'insurance', status: 200, responseMs: 155,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    timestamp: daysAgo(i, 8),  version: '1.3', tenantId: 'tenant_merlin_na', merchantId: 'meg_001', locale: 'en-US', page: 'payment',  status: 200, responseMs: 185,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    timestamp: daysAgo(i, 8),  version: '1.3', tenantId: 'tenant_merlin_na', merchantId: 'meg_001', locale: 'ja',    page: 'payment',  status: 200, responseMs: 190,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    timestamp: daysAgo(i, 10), version: '1.3', tenantId: 'tenant_pe',        merchantId: 'na1_001', locale: 'en-US', page: 'payment',  status: 200, responseMs: 172,
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    timestamp: daysAgo(i, 11), version: '1.3', tenantId: 'tenant_pe',        merchantId: 'na1_001', locale: 'en-US', page: 'insurance', status: 200, responseMs: 148,
  })),
  // v1.3 errors
  { timestamp: daysAgo(1, 14), version: '1.3', tenantId: 'tenant_cedarfair', merchantId: 'cf_001', locale: 'en-US', page: 'payment', status: 500, responseMs: 3200 },
  { timestamp: daysAgo(3, 16), version: '1.3', tenantId: 'tenant_sixflags',  merchantId: 'sf_001', locale: 'en-US', page: 'payment', status: 502, responseMs: 5000 },
  { timestamp: daysAgo(2, 15), version: '1.3', tenantId: 'tenant_pe',        merchantId: 'na1_001', locale: 'en-US', page: 'payment', status: 500, responseMs: 2800 },

  // v1.2 — previous release, active traffic (config 1.2.0 merchants)
  ...Array.from({ length: 25 }, (_, i) => ({
    timestamp: daysAgo(i, 11), version: '1.2', tenantId: 'tenant_cedarfair', merchantId: 'cf_002', locale: 'en-US', page: 'payment',   status: 200, responseMs: 160,
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    timestamp: daysAgo(i, 14), version: '1.2', tenantId: 'tenant_sixflags',  merchantId: 'sf_002', locale: 'en-US', page: 'payment',   status: 200, responseMs: 170,
  })),
  ...Array.from({ length: 6 },  (_, i) => ({
    timestamp: daysAgo(i + 1, 15), version: '1.2', tenantId: 'tenant_merlin_na', merchantId: 'meg_002', locale: 'en-US', page: 'payment', status: 200, responseMs: 200,
  })),
  ...Array.from({ length: 14 }, (_, i) => ({
    timestamp: daysAgo(i, 9),  version: '1.2', tenantId: 'tenant_pe',        merchantId: 'na1_002', locale: 'en-US', page: 'payment',  status: 200, responseMs: 165,
  })),
  ...Array.from({ length: 8 },  (_, i) => ({
    timestamp: daysAgo(i, 10), version: '1.2', tenantId: 'tenant_owa',       merchantId: 'na1_004', locale: 'en-US', page: 'payment',  status: 200, responseMs: 190,
  })),

  // v1.1 — older release, light traffic (config 1.1.0 merchants)
  ...Array.from({ length: 14 }, (_, i) => ({
    timestamp: daysAgo(i + 2, 9),  version: '1.1', tenantId: 'tenant_cedarfair', merchantId: 'cf_003', locale: 'en-US', page: 'payment',   status: 200, responseMs: 210,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    timestamp: daysAgo(i + 5, 10), version: '1.1', tenantId: 'tenant_cedarfair', merchantId: 'cf_003', locale: 'en-US', page: 'insurance', status: 200, responseMs: 195,
  })),
  ...Array.from({ length: 8 },  (_, i) => ({
    timestamp: daysAgo(i + 3, 11), version: '1.1', tenantId: 'tenant_sixflags',  merchantId: 'sf_003', locale: 'en-US', page: 'payment',   status: 200, responseMs: 220,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    timestamp: daysAgo(i + 1, 12), version: '1.1', tenantId: 'tenant_pe',        merchantId: 'na1_003', locale: 'en-US', page: 'payment',  status: 200, responseMs: 180,
  })),

  // v1.0 — oldest release, barely any traffic, deprecation candidates (config 1.0.0 merchants)
  ...Array.from({ length: 4 }, (_, i) => ({
    timestamp: daysAgo(i + 20, 9),  version: '1.0', tenantId: 'tenant_cedarfair', merchantId: 'cf_004', locale: 'en-US', page: 'payment',  status: 200, responseMs: 250,
  })),
  { timestamp: daysAgo(25, 10), version: '1.0', tenantId: 'tenant_cedarfair', merchantId: 'cf_004', locale: 'en-US', page: 'insurance', status: 200, responseMs: 240 },
  { timestamp: daysAgo(28, 11), version: '1.0', tenantId: 'tenant_sixflags',  merchantId: 'sf_004', locale: 'en-US', page: 'payment',  status: 200, responseMs: 260 },
  ...Array.from({ length: 6 },  (_, i) => ({
    timestamp: daysAgo(i + 2, 14), version: '1.0', tenantId: 'tenant_lgds',      merchantId: 'na1_005', locale: 'en-US', page: 'payment',  status: 200, responseMs: 210,
  })),
];

// Derives the nginx URL path version prefix from a full release version string.
// e.g. '1.3.0' → '1.3',  'v1.2.0' → '1.2'
export function releaseVersionToNginxPath(version: string): string {
  return version.replace(/^v/, '').split('.').slice(0, 2).join('.');
}

export interface VersionSummary {
  version: string;
  requestCount: number;
  errorCount: number;
  lastSeen: string;
  uniqueMerchants: string[];
  uniqueTenants: string[];
  isActive: boolean; // seen in last 7 days
}

export function getVersionSummaries(): VersionSummary[] {
  const map = new Map<string, VersionSummary>();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const entry of MOCK_NGINX_LOGS) {
    if (!map.has(entry.version)) {
      map.set(entry.version, {
        version: entry.version,
        requestCount: 0,
        errorCount: 0,
        lastSeen: entry.timestamp,
        uniqueMerchants: [],
        uniqueTenants: [],
        isActive: false,
      });
    }
    const s = map.get(entry.version)!;
    s.requestCount++;
    if (entry.status >= 400) s.errorCount++;
    if (entry.timestamp > s.lastSeen) s.lastSeen = entry.timestamp;
    if (!s.uniqueMerchants.includes(entry.merchantId)) s.uniqueMerchants.push(entry.merchantId);
    if (!s.uniqueTenants.includes(entry.tenantId)) s.uniqueTenants.push(entry.tenantId);
    if (new Date(entry.timestamp) > sevenDaysAgo) s.isActive = true;
  }

  return [...map.values()].sort((a, b) => {
    const [aMaj, aMin = 0] = a.version.split('.').map(Number);
    const [bMaj, bMin = 0] = b.version.split('.').map(Number);
    return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
  });
}

export function getLogsForMerchant(merchantId: string): NginxLogEntry[] {
  return MOCK_NGINX_LOGS
    .filter((l) => l.merchantId === merchantId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getMerchantVersionSummary(merchantId: string): { version: string; requestCount: number; lastSeen: string; pages: string[] }[] {
  const logs = getLogsForMerchant(merchantId);
  const map = new Map<string, { version: string; requestCount: number; lastSeen: string; pages: Set<string> }>();

  for (const l of logs) {
    if (!map.has(l.version)) map.set(l.version, { version: l.version, requestCount: 0, lastSeen: l.timestamp, pages: new Set() });
    const s = map.get(l.version)!;
    s.requestCount++;
    if (l.timestamp > s.lastSeen) s.lastSeen = l.timestamp;
    s.pages.add(l.page);
  }

  return [...map.values()]
    .map((s) => ({ ...s, pages: [...s.pages] }))
    .sort((a, b) => {
    const [aMaj, aMin = 0] = a.version.split('.').map(Number);
    const [bMaj, bMin = 0] = b.version.split('.').map(Number);
    return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
  });
}
