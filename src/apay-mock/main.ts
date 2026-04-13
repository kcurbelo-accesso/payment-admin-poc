import './style.css';
import { bootstrap } from './core/bootstrap.ts';
import { buildLegacyPreviewKey, buildSchemaKey, parseRouteParams } from './core/url-router';
import { manifest as defaultManifest } from './manifest';

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getConfigFromPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as { schema?: unknown; config?: unknown; navigation?: unknown };

  if (candidate.schema && typeof candidate.schema === 'object') {
    return candidate.schema;
  }

  if (candidate.config && typeof candidate.config === 'object') {
    return candidate.config;
  }

  if (candidate.navigation && typeof candidate.navigation === 'object') {
    return payload;
  }

  return null;
}

const { tenantId, merchantId } = parseRouteParams();
const schemaKey = buildSchemaKey(tenantId, merchantId);
const legacyPreviewKey = buildLegacyPreviewKey(merchantId);

const tenantMerchantSchemaPayload = parseJson(localStorage.getItem(schemaKey));
const adminSchemaPayload = parseJson(localStorage.getItem('apay-admin-schema'));
const legacyPreviewPayload = parseJson(localStorage.getItem(legacyPreviewKey));
const legacyFallbackPayload = parseJson(localStorage.getItem('apay-preview-config'));

const manifest =
  getConfigFromPayload(tenantMerchantSchemaPayload) ??
  getConfigFromPayload(adminSchemaPayload) ??
  getConfigFromPayload(legacyPreviewPayload) ??
  getConfigFromPayload(legacyFallbackPayload) ??
  defaultManifest;

bootstrap(manifest);
