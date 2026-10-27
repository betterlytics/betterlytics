import { describe, it, expect } from 'vitest';
import {
  UPDATING_DOCS_URL,
  isNewerVersion,
  parseReleaseVersion,
  resolveAvailableUpdate,
  resolveUpdateCheckPolicy,
} from './update-check-policy';

const SELF_HOST = { isCloud: false, appVersion: 'v1.5.1' };

function release(tag: string, flags: { draft?: boolean; prerelease?: boolean } = {}) {
  return { tag_name: tag, draft: flags.draft ?? false, prerelease: flags.prerelease ?? false };
}

describe('resolveUpdateCheckPolicy', () => {
  it('is on when UPDATE_CHECK_ENABLED is unset', () => {
    expect(resolveUpdateCheckPolicy(SELF_HOST)).toEqual({ enabled: true });
  });

  it('is off on cloud regardless of the other inputs', () => {
    expect(resolveUpdateCheckPolicy({ ...SELF_HOST, isCloud: true, updateCheckEnabled: 'true' })).toEqual({
      enabled: false,
      reason: 'cloud',
    });
  });

  it('is off for dev builds', () => {
    expect(resolveUpdateCheckPolicy({ ...SELF_HOST, appVersion: 'dev' })).toEqual({
      enabled: false,
      reason: 'dev_build',
    });
  });

  it.each(['false', 'FALSE', ' false '])('is off when UPDATE_CHECK_ENABLED=%j', (value) => {
    expect(resolveUpdateCheckPolicy({ ...SELF_HOST, updateCheckEnabled: value })).toEqual({
      enabled: false,
      reason: 'disabled',
    });
  });

  it.each(['true', '', '1'])('stays on when UPDATE_CHECK_ENABLED=%j', (value) => {
    expect(resolveUpdateCheckPolicy({ ...SELF_HOST, updateCheckEnabled: value })).toEqual({ enabled: true });
  });

  it.each(['v1.6.0-rc.1', 'abc1234', 'latest', ''])('is off for the non-release version %j', (appVersion) => {
    expect(resolveUpdateCheckPolicy({ ...SELF_HOST, appVersion })).toEqual({
      enabled: false,
      reason: 'invalid_version',
    });
  });
});

describe('parseReleaseVersion', () => {
  it('accepts versions with and without the v prefix', () => {
    expect(parseReleaseVersion('v1.5.1')).toEqual([1, 5, 1]);
    expect(parseReleaseVersion('10.0.12')).toEqual([10, 0, 12]);
  });

  it.each(['v1.5', 'v1.5.1-beta', 'v1.5.1.2', 'dev'])('rejects %j', (version) => {
    expect(parseReleaseVersion(version)).toBeNull();
  });
});

describe('isNewerVersion', () => {
  it('compares numerically, not as strings', () => {
    expect(isNewerVersion([1, 10, 0], [1, 9, 0])).toBe(true);
    expect(isNewerVersion([1, 9, 0], [1, 10, 0])).toBe(false);
  });

  it('counts patch releases', () => {
    expect(isNewerVersion([1, 5, 2], [1, 5, 1])).toBe(true);
  });

  it('is false for the same version', () => {
    expect(isNewerVersion([1, 5, 1], [1, 5, 1])).toBe(false);
  });
});

describe('resolveAvailableUpdate', () => {
  it('returns the newer release with its links', () => {
    expect(resolveAvailableUpdate(release('v1.6.0'), 'v1.5.1')).toEqual({
      version: 'v1.6.0',
      releaseNotesUrl: 'https://github.com/betterlytics/betterlytics/releases/tag/v1.6.0',
      updatingDocsUrl: UPDATING_DOCS_URL,
    });
  });

  it('returns null on the latest or a newer version', () => {
    expect(resolveAvailableUpdate(release('v1.5.1'), 'v1.5.1')).toBeNull();
    expect(resolveAvailableUpdate(release('v1.5.1'), 'v1.6.0')).toBeNull();
  });

  it('ignores drafts and prereleases', () => {
    expect(resolveAvailableUpdate(release('v1.6.0', { draft: true }), 'v1.5.1')).toBeNull();
    expect(resolveAvailableUpdate(release('v1.6.0', { prerelease: true }), 'v1.5.1')).toBeNull();
    expect(resolveAvailableUpdate(release('v1.6.0-rc.1'), 'v1.5.1')).toBeNull();
  });

  it('returns null for an unexpected response', () => {
    expect(resolveAvailableUpdate({ message: 'Not Found' }, 'v1.5.1')).toBeNull();
    expect(resolveAvailableUpdate(null, 'v1.5.1')).toBeNull();
  });
});
