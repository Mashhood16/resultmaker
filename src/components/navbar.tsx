'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogIn, ShieldAlert, Trophy } from 'lucide-react'
import { Session } from 'next-auth'

export function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname()
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null // These pages handle their own headers
  }

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            ResultMaker
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {!session ? (
            <Link href="/login">
              <Button variant="default" className="font-semibold rounded-full px-4 md:px-6">
                <LogIn className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          ) : session.user.role === 'admin' ? (
            <Link href="/admin">
              <Button variant="outline" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-foreground border-indigo-500/20 font-semibold rounded-full px-4 md:px-6 transition-all">
                <ShieldAlert className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Super Admin</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button variant="outline" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 font-semibold rounded-full px-4 md:px-6 transition-all">
                <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">School Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
