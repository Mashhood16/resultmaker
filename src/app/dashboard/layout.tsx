import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
