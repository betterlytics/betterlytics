import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { Callout } from "nextra/components";
import {
  DashboardSectionGrid,
  DashboardSectionCard,
} from "./app/components/DashboardSectionGrid";
import { HostingComparisonTable } from "./app/components/HostingComparisonTable";
import {
  IntegrationIconRow,
  IntegrationIcon,
} from "./app/components/IntegrationIconRow";
import { BlogFAQ } from "./app/blog/components/BlogFAQ";

const themeComponents = getThemeComponents();

export function useMDXComponents(components) {
  return {
    ...themeComponents,
    DashboardSectionGrid,
    DashboardSectionCard,
    HostingComparisonTable,
    IntegrationIconRow,
    IntegrationIcon,
    Callout,
    FAQ: BlogFAQ,
    ...components,
  };
}
