import { en } from './locales/en';
import { da } from './locales/da';
import { it } from './locales/it';

export interface ComparisonLocaleContent {
  name: string;
  logo?: string;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  hero: {
    title: string;
    titleHighlight?: string;
    subtitle: string;
  };
  keyDifferentiators: {
    title: string;
    betterlytics: string;
    competitor: string;
  }[];
  comparison: {
    categories: {
      name: string;
      features: {
        name: string;
        betterlytics: boolean | string;
        competitor: boolean | string;
      }[];
    }[];
  };
  detailedComparison: {
    title: string;
    content: string;
    icon:
      | 'shield'
      | 'zap'
      | 'target'
      | 'sparkles'
      | 'dollar'
      | 'rocket'
      | 'eye'
      | 'layers'
      | 'server'
      | 'clock'
      | 'lock'
      | 'gauge'
      | 'check';
  }[];
  cta?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };
}

const LOCALES: Record<string, Record<string, ComparisonLocaleContent>> = {
  en,
  da,
  it,
};

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as Array<keyof typeof LOCALES>;

export const getCompetitorData = (slug: string, locale: string = 'en'): ComparisonLocaleContent | undefined => {
  const localeData = LOCALES[locale] || LOCALES.en;
  const content = localeData[slug];

  if (!content) {
    return undefined;
  }

  return content;
};

export const hasLocale = (locale: string): boolean => {
  return locale in LOCALES;
};

export const getCompetitorSlugs = (): string[] => {
  return Object.keys(en);
};
