import { MOCK_GITHUB_RELEASES } from './githubReleases';
import { syncReleasesFromGitHub } from '../services/releaseSync';

export type ChangelogType = 'added' | 'changed' | 'deprecated';
export type AreaType = 'pages' | 'integrations' | 'theme' | 'navigation' | 'components';
export type InputType = 'boolean' | 'text' | 'number';
export type ScopeType = 'global' | 'page' | 'component' | 'integration';

export interface ChangelogItem {
  type: ChangelogType;
  area: AreaType;
  description: string;
}

export interface MigrationField {
  id: string;
  title: string;
  description: string;
  path: string; // dot-notation path in the config
  defaultValue: any;
  required: boolean;
  inputType: InputType;
  scope: ScopeType;
  scopeFilter?: {
    pageId?: string;
    componentType?: string;
    integrationProvider?: string;
  };
}

export interface SchemaRelease {
  version: string;
  date: string;
  title: string;
  description: string;
  changelog: ChangelogItem[];
  migrations: MigrationField[];
}

export const SCHEMA_RELEASES: SchemaRelease[] = syncReleasesFromGitHub(MOCK_GITHUB_RELEASES);

// To modify release data, edit src/admin/data/githubReleases.ts.
// When connecting to the real GitHub API, replace MOCK_GITHUB_RELEASES with
// the result of GET /repos/{owner}/{repo}/releases and nothing else changes.

export const LATEST_VERSION = SCHEMA_RELEASES[SCHEMA_RELEASES.length - 1].version;

export function getReleaseByVersion(version: string): SchemaRelease | undefined {
  return SCHEMA_RELEASES.find((r) => r.version === version);
}

/** Returns all releases strictly between fromVersion and toVersion (exclusive of from, inclusive of to) */
export function getReleasesBetween(fromVersion: string, toVersion: string): SchemaRelease[] {
  const versions = SCHEMA_RELEASES.map((r) => r.version);
  const fromIdx = versions.indexOf(fromVersion);
  const toIdx = versions.indexOf(toVersion);
  if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) return [];
  return SCHEMA_RELEASES.slice(fromIdx + 1, toIdx + 1);
}

/** All migration fields needed to bring a config from fromVersion to toVersion */
export function getAccumulatedMigrations(fromVersion: string, toVersion: string): MigrationField[] {
  const releases = getReleasesBetween(fromVersion, toVersion);
  return releases.flatMap((r) => r.migrations);
}

/** Compare two specific releases — returns added, changed, deprecated items per release */
export function compareReleases(
  versionA: string,
  versionB: string
): { a: SchemaRelease; b: SchemaRelease; onlyInA: ChangelogItem[]; onlyInB: ChangelogItem[]; changed: ChangelogItem[] } | null {
  const a = getReleaseByVersion(versionA);
  const b = getReleaseByVersion(versionB);
  if (!a || !b) return null;
  // Items introduced between A and B
  const newInB = getReleasesBetween(versionA, versionB).flatMap((r) => r.changelog);
  return { a, b, onlyInA: [], onlyInB: newInB, changed: b.changelog.filter((c) => c.type === 'changed') };
}
