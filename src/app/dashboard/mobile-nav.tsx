'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UploadCloud
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Roster", href: "/dashboard/roster", icon: Users },
  { name: "Wizard", href: "/dashboard/wizard", icon: FileText },
  { name: "Manage", href: "/dashboard/uploads", icon: UploadCloud },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-xl z-50 pb-2">
      <nav className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-xl transition-all duration-300 ${
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
