import { ReactNode } from "react";
import { CreateFunnelDialog } from "./CreateFunnelDialog";

type FunnelsLayoutProps = {
  children: ReactNode;
}

export default function FunnelsClient({ children }: FunnelsLayoutProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Funnels</h1>
          <p className="text-sm text-gray-500">Funnels for your website</p>
        </div>
        <div className="relative inline-block text-left">
          <CreateFunnelDialog />
        </div>
      </div>
      {children}
    </div>
  )
}
