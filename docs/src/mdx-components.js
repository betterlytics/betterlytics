import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import {
  DashboardSectionGrid,
  DashboardSectionCard,
} from "./app/components/DashboardSectionGrid";
import { HostingComparisonTable } from "./app/components/HostingComparisonTable";
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
    HostingComparisonTable,
    IntegrationIconRow,
    IntegrationIcon,
    ...components,
  };
}
