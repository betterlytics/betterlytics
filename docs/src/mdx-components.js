import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import {
  DashboardSectionGrid,
  DashboardSectionCard,
} from "./app/components/DashboardSectionGrid";
import { HostingComparisonTable } from "./app/components/HostingComparisonTable";
import { FeatureCard, FeatureGrid } from "./app/components/FeatureCard";
import {
  IntegrationIconRow,
  IntegrationIcon,
} from "./app/components/IntegrationIconRow";

const themeComponents = getThemeComponents();

export function useMDXComponents(components) {
  return {
    ...themeComponents,
    DashboardSectionGrid,
    DashboardSectionCard,
    FeatureCard,
    FeatureGrid,
    HostingComparisonTable,
    IntegrationIconRow,
    IntegrationIcon,
    ...components,
  };
}
