export type BlogAuthor = {
  name: string;
  role: string;
  kind: 'Person' | 'Organization';
  url?: string;
};

export const BLOG_AUTHORS = {
  team: { name: 'The Betterlytics team', role: 'Betterlytics', kind: 'Organization' },
  thomas: { name: 'Thomas Schauser', role: 'Co-founder & Engineer', kind: 'Person' },
} as const satisfies Record<string, BlogAuthor>;

export type BlogAuthorKey = keyof typeof BLOG_AUTHORS;
