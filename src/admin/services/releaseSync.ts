import type { GitHubRelease } from '../data/githubReleases';
import type { SchemaRelease, MigrationField, ChangelogItem, ChangelogType, InputType, ScopeType } from '../data/releases';

// ── Parsing helpers ───────────────────────────────────────────────────────────

function extractSection(body: string, heading: string): string {
  const pattern = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  return body.match(pattern)?.[1]?.trim() ?? '';
}

function extractSubsection(section: string, heading: string): string {
  const pattern = new RegExp(`###\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|$)`, 'i');
  return section.match(pattern)?.[1]?.trim() ?? '';
}

function parseChangelogLines(text: string, type: ChangelogType): ChangelogItem[] {
  if (!text) return [];
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => {
      // - **Area**: description
      const match = line.match(/^-\s+\*\*([^*]+)\*\*:\s*(.+)$/);
      if (!match) return null;
      const area = match[1].toLowerCase().trim() as ChangelogItem['area'];
      const description = match[2].trim();
      return { type, area, description } satisfies ChangelogItem;
    })
    .filter((item): item is ChangelogItem => item !== null);
}

function parseMigrationBlocks(migrationSection: string): MigrationField[] {
  if (!migrationSection) return [];

  // Split on ### field-id headings
  const blocks = migrationSection
    .split(/\n(?=###\s)/)
    .map(b => b.trim())
    .filter(b => b.startsWith('###'));

  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim());
    const id = lines[0].replace(/^###\s+/, '').trim();

    const get = (key: string): string => {
      const line = lines.find(l => l.toLowerCase().startsWith(`- **${key.toLowerCase()}**:`));
      if (!line) return '';
      return line.replace(new RegExp(`^-\\s+\\*\\*${key}\\*\\*:\\s*`, 'i'), '').replace(/`/g, '').trim();
    };

    const rawDefault = get('Default');
    let defaultValue: any = rawDefault;
    if (rawDefault === 'true') defaultValue = true;
    else if (rawDefault === 'false') defaultValue = false;
    else if (rawDefault === '') defaultValue = '';
    else if (!isNaN(Number(rawDefault)) && rawDefault !== '') defaultValue = Number(rawDefault);
    else if (/^\[.+\]$/.test(rawDefault)) {
      try { defaultValue = JSON.parse(rawDefault); } catch { /* leave as string */ }
    }

    const rawScopeFilter = get('ScopeFilter');
    const scopeFilter: MigrationField['scopeFilter'] = {};
    if (rawScopeFilter) {
      rawScopeFilter.split(',').map(p => p.trim()).forEach(pair => {
        const [k, v] = pair.split('=').map(s => s.trim());
        if (k === 'pageId') scopeFilter.pageId = v;
        else if (k === 'componentType') scopeFilter.componentType = v;
        else if (k === 'integrationProvider') scopeFilter.integrationProvider = v;
      });
    }

    const field: MigrationField = {
      id,
      title: id
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: get('Description'),
      path: get('Path'),
      defaultValue,
      required: get('Required').toLowerCase() === 'true',
      inputType: (get('Type') as InputType) || 'text',
      scope: (get('Scope') as ScopeType) || 'global',
      ...(Object.keys(scopeFilter).length > 0 ? { scopeFilter } : {}),
    };

    return field;
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseGitHubRelease(release: GitHubRelease): SchemaRelease {
  const body = release.body ?? '';

  const overviewText = extractSection(body, 'Overview');
  const changelogSection = extractSection(body, 'Changelog');
  const migrationSection = extractSection(body, 'Schema Migration');

  const changelog: ChangelogItem[] = [
    ...parseChangelogLines(extractSubsection(changelogSection, 'Added'), 'added'),
    ...parseChangelogLines(extractSubsection(changelogSection, 'Changed'), 'changed'),
    ...parseChangelogLines(extractSubsection(changelogSection, 'Deprecated'), 'deprecated'),
  ];

  const migrations = parseMigrationBlocks(migrationSection);

  // tag_name is 'v1.2.0' — strip the leading 'v'
  const version = release.tag_name.replace(/^v/, '');

  return {
    version,
    date: release.published_at.slice(0, 10), // ISO date → YYYY-MM-DD
    title: release.name.replace(/^v[\d.]+\s*[—-]\s*/, '').trim(),
    description: overviewText,
    changelog,
    migrations,
    // Pass through GitHub metadata for UI linkback
    _github: {
      htmlUrl: release.html_url,
      repo: release.html_url.match(/github\.com\/([^/]+\/[^/]+)\//)?.[1] ?? '',
    },
  } as SchemaRelease & { _github: { htmlUrl: string; repo: string } };
}

export function syncReleasesFromGitHub(releases: GitHubRelease[]): SchemaRelease[] {
  return releases
    .filter(r => !r.draft && !r.prerelease)
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime())
    .map(parseGitHubRelease);
}
