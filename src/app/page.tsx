import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Users, Trophy, ArrowRight, Building2 } from 'lucide-react'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()
  
  const classes = await prisma.class.findMany({
    include: {
      _count: {
        select: { students: true }
      },
      school: true
    },
    orderBy: [
      { school: { name: 'asc' } },
      { name: 'asc' }
    ]
  })

  // Group classes by school
  const groupedClasses = classes.reduce((acc, c) => {
    if (!acc[c.school.name]) acc[c.school.name] = []
    acc[c.school.name].push(c)
    return acc
  }, {} as Record<string, typeof classes>)

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="text-center space-y-4 pt-8 md:pt-12">
          {session?.user?.role === 'school' && (
            <div className="inline-flex items-center justify-center mb-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-700">
              <Building2 className="w-4 h-4 mr-2" />
              {session.user.name}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Student Leaderboards
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            Select a class from your school to view rankings, top performers, and detailed academic statistics.
          </p>
        </header>

        {Object.entries(groupedClasses).length === 0 ? (
          <div className="text-center text-zinc-500 py-12 animate-in fade-in duration-1000">
            No classes found. Please ask your school administrator to upload data.
          </div>
        ) : (
          Object.entries(groupedClasses).map(([schoolName, schoolClasses], index) => (
            <div key={schoolName} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: `${index * 150 + 300}ms` }}>
              <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Building2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">{schoolName}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schoolClasses.map((c) => (
                  <Link href={`/${c.id}`} key={c.id}>
                    <Card className="relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer backdrop-blur-2xl group h-full shadow-2xl hover:shadow-emerald-500/20">
                      {/* Glowing background blob */}
                      <div className="absolute -inset-24 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl rounded-full" />
                      
                      {/* Border highlight */}
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                      
                      <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 group-hover:to-white/90 transition-all duration-500">
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
          ))
        )}
      </div>
    </main>
  )
}
