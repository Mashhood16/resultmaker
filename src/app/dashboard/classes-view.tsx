'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Trophy, ArrowRight, BookOpen } from 'lucide-react'

type ClassData = {
  id: string
  name: string
  _count: { students: number }
}

export function ClassesView({ classes }: { classes: ClassData[] }) {
  if (classes.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-12 animate-in fade-in duration-1000">
        No classes found. Upload a master roster to get started.
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <Link href={`/${c.id}`} key={c.id}>
            <Card className="relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer backdrop-blur-2xl group h-full shadow-2xl hover:shadow-emerald-500/20">
              {/* Glowing background blob */}
              <div className="absolute -inset-24 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl rounded-full" />
              
              {/* Border highlight */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 group-hover:to-white/90 transition-all duration-500 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-white/40 group-hover:text-emerald-400 transition-colors duration-500" />
                  {c.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                <div className="flex items-center text-zinc-400 mb-6 bg-black/40 w-fit px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                  <Users className="w-4 h-4 mr-2 text-emerald-400" />
                  <span className="text-sm font-medium">{c._count.students} Enrolled</span>
                </div>
                
                <div className="flex items-center text-sm font-bold text-white group-hover:text-emerald-300 transition-colors bg-white/5 group-hover:bg-emerald-500/20 px-4 py-3 rounded-xl border border-white/5 group-hover:border-emerald-500/30 w-full justify-between overflow-hidden relative">
                  <span className="relative z-10 flex items-center">
                    <Trophy className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    View Leaderboard
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  {/* Swipe effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
