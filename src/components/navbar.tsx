'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogIn, ShieldAlert, Trophy, LogOut } from 'lucide-react'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname()
  
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="CendroClass Logo" className="h-10 sm:h-12 w-auto object-contain" />
          <span className="font-bold text-lg md:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            CendroClass
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!session ? (
            <Link href="/login">
              <Button variant="default" className="font-semibold rounded-full px-2 sm:px-4 md:px-6 h-8 sm:h-10">
                <LogIn className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
                <span className="hidden min-[400px]:inline sm:hidden ml-2">Login</span>
              </Button>
            </Link>
          ) : session.user.role === 'admin' ? (
            <Link href="/admin">
              <Button variant="outline" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-foreground border-indigo-500/20 font-semibold rounded-full px-2 sm:px-4 md:px-6 transition-all h-8 sm:h-10">
                <ShieldAlert className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Super Admin</span>
                <span className="hidden min-[400px]:inline sm:hidden ml-2">Admin</span>
              </Button>
            </Link>
          ) : session.user.role === 'student' ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 font-semibold rounded-full px-2 sm:px-4 md:px-6 transition-all h-8 sm:h-10">
                  <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">My Class</span>
                  <span className="hidden min-[400px]:inline sm:hidden ml-2">Class</span>
                </Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: '/' })} variant="ghost" className="rounded-full w-8 h-8 sm:w-auto sm:h-10 sm:px-4 flex items-center justify-center text-muted-foreground hover:text-destructive" title="Sign Out">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 font-semibold rounded-full px-2 sm:px-4 md:px-6 transition-all h-8 sm:h-10">
                  <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">School Dashboard</span>
                  <span className="hidden min-[400px]:inline sm:hidden ml-2">Dashboard</span>
                </Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: '/' })} variant="ghost" className="rounded-full w-8 h-8 sm:w-auto sm:h-10 sm:px-4 flex items-center justify-center text-muted-foreground hover:text-destructive" title="Sign Out">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
