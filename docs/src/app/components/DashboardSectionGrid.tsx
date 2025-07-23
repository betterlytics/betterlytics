import { DashboardSectionCard } from "./DashboardSectionCard";

interface DashboardSectionGridProps {
  children: React.ReactNode;
}

export function DashboardSectionGrid({ children }: DashboardSectionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 my-8">
      {children}
    </div>
  );
}

export { DashboardSectionCard };
