import { Toaster } from "@/components/ui/sonner"
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { DashboardProvider } from "./DashboardProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Topbar />
          <div className="flex-1">{children}</div>
        </main>
        <Toaster />
      </div>
    </DashboardProvider>
  );
} 