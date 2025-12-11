import type { JSX } from 'react';
import { z } from 'zod';

export const ChangelogVersionSchema = z
  .string()
  .regex(/^v\d+(?:\.\d+){0,2}$/i, 'Invalid Changelog version format. Use v{major}.{minor}.{patch}');

export type ChangelogVersion = z.infer<typeof ChangelogVersionSchema>;

export type ChangelogMetadata = {
  version: ChangelogVersion;
  releasedAt: string;
  title: string;
  summary: string;
};

export type ChangelogContentBlock =
  | {
      type: 'text';
      body: string | readonly string[];
    }
  | {
      type: 'list';
      items: readonly string[];
    }
  | {
      type: 'image';
      src: string;
      alt: string;
      caption?: string;
      width: number;
      height: number;
    };

export type ChangelogSection = {
  id: string;
  title: string;
  blocks: readonly ChangelogContentBlock[];
};

export type ChangelogEntryData = {
  metadata: ChangelogMetadata;
  sections: readonly ChangelogSection[];
};

export type ChangelogEntry = ChangelogMetadata & {
  Content: () => JSX.Element;
};
