import Link from "next/link";
import { LayoutDashboard, FileText, Smartphone, CircleDot, Globe, Link2 } from "lucide-react";
import { LocaleSelect } from "./locale/LocaleSelect";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  //{ name: "Realtime", href: "/dashboard/realtime", icon: <BarChart size={18} /> },
  { name: "Pages", href: "/dashboard/pages", icon: <FileText size={18} /> },
  { name: "Referrers", href: "/dashboard/referrers", icon: <Link2 size={18} /> },
  //{ name: "Geography", href: "/dashboard/geography", icon: <Globe size={18} /> },
  //{ name: "Referrers", href: "/dashboard/referrers", icon: <Link2 size={18} /> },
  { name: "Geography", href: "/dashboard/geography", icon: <Globe size={18} /> },
  { name: "Devices", href: "/dashboard/devices", icon: <Smartphone size={18} /> },
  { name: "Events", href: "/dashboard/events", icon: <CircleDot size={18} /> },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white h-screen border-r flex flex-col p-4">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="bg-gray-900 text-white rounded p-2"><LayoutDashboard size={20} /></span>
          <div>
            <div className="font-bold text-sm">Better-Analytics</div>
            <div className="text-xs text-gray-500">Dashboard</div>
          </div>
        </div>
      </div>
      <nav className="flex-1">
        <div className="text-xs text-gray-400 mb-2">Analytics</div>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 text-gray-700 text-sm font-medium">
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