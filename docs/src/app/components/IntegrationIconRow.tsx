import { IntegrationIcon } from "./IntegrationIcon";

interface IntegrationIconRowProps {
  children: React.ReactNode;
}

export function IntegrationIconRow({ children }: IntegrationIconRowProps) {
  return (
    <div className="flex flex-wrap gap-8 my-8">
      {children}
    </div>
  );
}

export { IntegrationIcon };
