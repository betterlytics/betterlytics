import { z } from 'zod';

export const UPDATE_CHECK_RELEASE_VERSION_REGEX = /^v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/;

// The /releases/latest endpoint already excludes drafts and prereleases; the flags are checked again anyway
export const GithubLatestReleaseSchema = z.object({
  tag_name: z.string(),
  draft: z.boolean(),
  prerelease: z.boolean(),
});

export type UpdateCheckDisabledReason = 'cloud' | 'dev_build' | 'disabled' | 'invalid_version';

export type UpdateCheckPolicy = { enabled: true } | { enabled: false; reason: UpdateCheckDisabledReason };

export type AvailableUpdate = {
  version: string;
  releaseNotesUrl: string;
  updatingDocsUrl: string;
};
