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
      <div className="text-center text-muted-foreground py-12 animate-in fade-in duration-1000">
        No classes found. Upload a master roster to get started.
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <Link href={`/leaderboard/${encodeURIComponent(c.name)}`} key={c.id}>
            <Card className="relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer shadow-lg hover:shadow-primary/20 group h-full">
              {/* Glowing background blob */}
              <div className="absolute -inset-24 bg-gradient-to-r from-primary/0 via-primary/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl rounded-full" />
              
              {/* Border highlight */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-4xl font-black text-foreground group-hover:text-primary transition-all duration-500 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                  {c.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                <div className="flex items-center text-muted-foreground mb-6 bg-background w-fit px-3 py-1.5 rounded-full border border-border shadow-inner">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-sm font-medium">{c._count.students} Enrolled</span>
                </div>
                
                <div className="flex items-center text-sm font-bold text-foreground group-hover:text-primary transition-colors bg-background group-hover:bg-primary/10 px-4 py-3 rounded-xl border border-border group-hover:border-primary/30 w-full justify-between overflow-hidden relative">
                  <span className="relative z-10 flex items-center">
                    <Trophy className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    View Leaderboard
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  {/* Swipe effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-1000" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
