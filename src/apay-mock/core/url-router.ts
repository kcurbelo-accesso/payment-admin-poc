// Map tenant slugs to IDs
const TENANT_SLUG_MAP: Record<string, string> = {
  accesso: 'tenant_accesso',
  cedarfair: 'tenant_cedarfair',
  sixflags: 'tenant_sixflags',
};

export interface RouteParams {
  tenantId: string | null;
  merchantId: string | null;
}

export function parseRouteParams(): RouteParams {
  const path = window.location.pathname;
  const segments = path.split('/').filter((s) => s);

  if (segments.length >= 2) {
    let tenantId = segments[0];
    // Map slug to full tenant ID if needed
    if (!tenantId.startsWith('tenant_')) {
      tenantId = TENANT_SLUG_MAP[tenantId] || tenantId;
    }

    return {
      tenantId,
      merchantId: segments[1],
    };
  }

  return {
    tenantId: null,
    merchantId: null,
  };
}

export function buildSchemaKey(tenantId: string | null, merchantId: string | null): string {
  if (tenantId && merchantId) {
    return `apay-schema-${tenantId}-${merchantId}`;
  }
  return 'apay-schema-fallback';
}

export function buildLegacyPreviewKey(merchantId: string | null): string {
  if (merchantId) {
    return `apay-preview-config-${merchantId}`;
  }
  return 'apay-preview-config';
}
