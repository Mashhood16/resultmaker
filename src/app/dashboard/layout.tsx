import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const role = session?.user?.role || "student"; // Default fallback

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav role={role} />
    </div>
  );
}
