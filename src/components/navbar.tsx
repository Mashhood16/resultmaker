'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogIn, ShieldAlert } from 'lucide-react'
import { Session } from 'next-auth'

export function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname()
  
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
    return null // These pages handle their own headers
  }

  return (
    <header className="w-full border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-tight text-white flex items-center gap-2 hover:opacity-80 transition-opacity">
          Leader<span className="text-emerald-400">Board</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {!session ? (
            <Link href="/login">
              <Button variant="outline" className="bg-white text-black hover:bg-zinc-200 border-none font-semibold rounded-full px-6">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          ) : session.user.role === 'admin' ? (
            <Link href="/admin">
              <Button variant="outline" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border-indigo-500/20 font-semibold rounded-full px-6 transition-all">
                <ShieldAlert className="w-4 h-4 mr-2" />
                Super Admin
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button variant="outline" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border-emerald-500/20 font-semibold rounded-full px-6 transition-all">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                School Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
