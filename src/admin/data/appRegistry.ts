export interface RegisteredApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** URL template — tokens: {tenantId}, {merchantId} */
  previewUrlTemplate: string;
  color: string;
  status: 'active' | 'planned';
}

export const APP_REGISTRY: RegisteredApp[] = [
  {
    id: '1504',
    name: 'accessoPay',
    slug: 'checkout-standard',
    description: 'Main checkout application — full payment flow with all feature set',
    previewUrlTemplate: '/{tenantId}/{merchantId}',
    color: '#15803d',
    status: 'active',
  },
  {
    id: '1505',
    name: 'payment-manager',
    slug: 'payment-manager',
    description: 'Lightweight payment tokenization — subset of accessoPay features',
    previewUrlTemplate: '/manager/{tenantId}/{merchantId}',
    color: '#1d4ed8',
    status: 'active',
  },
];

export function getAppById(id: string): RegisteredApp | undefined {
  return APP_REGISTRY.find((a) => a.id === id);
}

export function buildPreviewUrl(app: RegisteredApp, tenantId: string, merchantId: string): string {
  return app.previewUrlTemplate
    .replace('{tenantId}', tenantId)
    .replace('{merchantId}', merchantId);
}
