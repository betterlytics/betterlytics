import {
  GithubLatestReleaseSchema,
  UPDATE_CHECK_RELEASE_VERSION_REGEX,
  type AvailableUpdate,
  type UpdateCheckPolicy,
} from '@/entities/system/updateCheck.entities';

export const UPDATE_CHECK_LATEST_RELEASE_URL =
  'https://api.github.com/repos/betterlytics/betterlytics/releases/latest';
const RELEASE_NOTES_BASE_URL = 'https://github.com/betterlytics/betterlytics/releases/tag/';

type ReleaseVersion = [major: number, minor: number, patch: number];

export type UpdateCheckPolicyInput = {
  isCloud: boolean;
  appVersion: string;
  updateCheckEnabled?: string;
};

export function resolveUpdateCheckPolicy(input: UpdateCheckPolicyInput): UpdateCheckPolicy {
  if (input.isCloud) return { enabled: false, reason: 'cloud' };
  if (input.appVersion === 'dev') return { enabled: false, reason: 'dev_build' };
  if (input.updateCheckEnabled?.trim().toLowerCase() === 'false') return { enabled: false, reason: 'disabled' };
  if (!parseReleaseVersion(input.appVersion)) return { enabled: false, reason: 'invalid_version' };
  return { enabled: true };
}

export function parseReleaseVersion(version: string): ReleaseVersion | null {
  const match = UPDATE_CHECK_RELEASE_VERSION_REGEX.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewerVersion(candidate: ReleaseVersion, current: ReleaseVersion): boolean {
  for (let i = 0; i < 3; i++) {
    if (candidate[i] !== current[i]) return candidate[i] > current[i];
  }
  return false;
}

export function resolveAvailableUpdate(release: unknown, appVersion: string): AvailableUpdate | null {
  const parsed = GithubLatestReleaseSchema.safeParse(release);
  if (!parsed.success || parsed.data.draft || parsed.data.prerelease) return null;

  const tag = parsed.data.tag_name.trim();
  const latest = parseReleaseVersion(tag);
  const current = parseReleaseVersion(appVersion);
  if (!latest || !current || !isNewerVersion(latest, current)) return null;

  return {
    version: tag,
    releaseNotesUrl: `${RELEASE_NOTES_BASE_URL}${encodeURIComponent(tag)}`,
  };
}
