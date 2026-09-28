import { describe, expect, it } from 'vitest';
import { FrameworkId } from './FrameworkGrid';
import { getFrameworkCode, IntegrationTranslations } from './frameworkCodes';

const translations: IntegrationTranslations = new Proxy({}, { get: () => translations }) as IntegrationTranslations;

const ALL_FRAMEWORKS = Object.keys({
  html: true,
  nextjs: true,
  react: true,
  vue: true,
  nuxt: true,
  svelte: true,
  remix: true,
  gatsby: true,
  astro: true,
  angular: true,
  shopify: true,
  wordpress: true,
  webflow: true,
  wix: true,
  squarespace: true,
  gtm: true,
  laravel: true,
  solidjs: true,
} satisfies Record<FrameworkId, true>) as FrameworkId[];

const baseConfig = {
  siteId: 'site-123',
  analyticsUrl: 'https://analytics.example.com',
  serverUrl: 'https://analytics.example.com',
};

function initSnippets(isCloud: boolean): string[] {
  return ALL_FRAMEWORKS.flatMap((framework) => {
    const code = getFrameworkCode(framework, { ...baseConfig, isCloud }, translations);
    const steps = [...(code.steps ?? []), ...(code.variants ?? []).flatMap((variant) => variant.steps)];
    return steps.map((step) => step.code).filter((snippet) => snippet?.includes('betterlytics.init'));
  }) as string[];
}

describe('getFrameworkCode npm snippets', () => {
  it('finds every npm snippet', () => {
    expect(initSnippets(false).length).toBeGreaterThanOrEqual(12);
    expect(initSnippets(true).length).toBeGreaterThanOrEqual(12);
  });

  it('points scriptUrl and serverUrl at the instance off-cloud', () => {
    for (const snippet of initSnippets(false)) {
      expect(snippet).toMatch(/scriptUrl: (["'])https:\/\/analytics\.example\.com\/analytics\.js\1/);
      expect(snippet).toMatch(/serverUrl: (["'])https:\/\/analytics\.example\.com\/event\1/);
    }
  });

  it('keeps the bare init call on cloud', () => {
    for (const snippet of initSnippets(true)) {
      expect(snippet).toMatch(/betterlytics\.init\((["'])site-123\1\)/);
      expect(snippet).not.toContain('scriptUrl');
      expect(snippet).not.toContain('serverUrl');
    }
  });

  it('indents the options to match the surrounding code', () => {
    const [react] = getFrameworkCode('react', { ...baseConfig, isCloud: false }, translations).steps!.slice(1);
    expect(react.code).toBe(`import betterlytics from "@betterlytics/tracker"

betterlytics.init("site-123", {
  scriptUrl: "https://analytics.example.com/analytics.js",
  serverUrl: "https://analytics.example.com/event",
})`);

    const [, svelte] = getFrameworkCode('svelte', { ...baseConfig, isCloud: false }, translations).steps!;
    expect(svelte.code).toContain(`    betterlytics.init('site-123', {
      scriptUrl: 'https://analytics.example.com/analytics.js',
      serverUrl: 'https://analytics.example.com/event',
    })`);
  });
});
