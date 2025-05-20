import Link from "next/link";
import { LayoutDashboard, FileText, Smartphone, CircleDot, Globe, Link2, Funnel, DollarSign } from "lucide-react";
import { SidebarHeader } from "./SidebarHeader";
import { LocaleSelect } from "./locale/LocaleSelect";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  //{ name: "Realtime", href: "/dashboard/realtime", icon: <BarChart size={18} /> },
  { name: "Pages", href: "/dashboard/pages", icon: <FileText size={18} /> },
  { name: "Referrers", href: "/dashboard/referrers", icon: <Link2 size={18} /> },
  //{ name: "Geography", href: "/dashboard/geography", icon: <Globe size={18} /> },
  //{ name: "Referrers", href: "/dashboard/referrers", icon: <Link2 size={18} /> },
  { name: "Geography", href: "/dashboard/geography", icon: <Globe size={18} /> },
  { name: "User Journey", href: "/dashboard/user-journey", icon: <CircleDot size={18} /> },
  { name: "Funnels", href: "/dashboard/funnels", icon: <Funnel size={18} /> },
  { name: "Devices", href: "/dashboard/devices", icon: <Smartphone size={18} /> },
  { name: "Campaigns", href: "/dashboard/campaign", icon: <DollarSign size={18} /> },
  { name: "Events", href: "/dashboard/events", icon: <CircleDot size={18} /> },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-sidebar border-r border-border h-screen flex flex-col p-4">
      <SidebarHeader />
      <nav className="flex-1">
        <div className="text-xs text-muted-foreground mb-2">Analytics</div>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent hover:text-accent-foreground text-foreground text-sm font-medium">
                <span>{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <LocaleSelect className="mt-auto ml-auto" />
    </aside>
  );
} 