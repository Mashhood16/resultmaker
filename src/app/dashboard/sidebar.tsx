"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UploadCloud,
  LogOut,
  Settings,
  MonitorPlay
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true, roles: ["admin", "school", "teacher"] },
  { name: "Student Roster", href: "/dashboard/roster", icon: Users, roles: ["admin", "school", "teacher"] },
  { name: "Result Wizard", href: "/dashboard/wizard", icon: FileText, roles: ["admin", "school", "teacher"] },
  { name: "Online Tests", href: "/dashboard/online-tests", icon: MonitorPlay, roles: ["admin", "school", "teacher"] },
  { name: "Manage Data", href: "/dashboard/uploads", icon: UploadCloud, roles: ["admin", "school", "teacher"] },
  { name: "Manage Users", href: "/dashboard/users", icon: Settings, roles: ["admin", "school", "teacher"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r border-border bg-card/30 backdrop-blur-md flex flex-col justify-between sticky top-0 hidden md:flex">
      <div className="p-6">
        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6">Dashboard</h2>
        <nav className="space-y-2">
          {navItems.filter(item => item.roles.includes(role)).map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-6 border-t border-border">
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
