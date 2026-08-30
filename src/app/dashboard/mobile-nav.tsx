'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UploadCloud,
  Settings,
  MonitorPlay
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true, roles: ["admin", "school", "teacher"] },
  { name: "Roster", href: "/dashboard/roster", icon: Users, roles: ["admin", "school", "teacher"] },
  { name: "Wizard", href: "/dashboard/wizard", icon: FileText, roles: ["admin", "school", "teacher"] },
  { name: "Tests", href: "/dashboard/online-tests", icon: MonitorPlay, roles: ["admin", "school", "teacher"] },
  { name: "Manage", href: "/dashboard/uploads", icon: UploadCloud, roles: ["admin", "school", "teacher"] },
  { name: "Users", href: "/dashboard/users", icon: Settings, roles: ["admin", "school", "teacher"] },
];

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl z-50 pb-2">
      <nav className="flex justify-between items-center px-1 py-2 w-full max-w-full overflow-hidden">
        {navItems.filter(item => item.roles.includes(role)).map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-1 flex-1 min-w-0 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
