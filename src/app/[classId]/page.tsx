import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeaderboardContent } from './leaderboard-content'
import { Suspense } from 'react'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function ClassLeaderboardPage({
  params,
  searchParams
}: {
  params: { classId: string }
  searchParams: { subject?: string }
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const classData = await prisma.class.findUnique({
    where: { id: params.classId }
  })

  if (!classData) return notFound()

  // Prevent schools from viewing classes that don't belong to them
  if (session.user.role === 'school' && classData.schoolId !== session.user.id) {
    redirect('/')
  }

  // Prevent teachers and students from viewing unassigned classes
  if ((session.user.role === 'teacher' || session.user.role === 'student') && 
      !session.user.classIds?.includes(classData.id)) {
    redirect('/')
  }

  // Get all subjects that have scores for this class
  const subjects = await prisma.subject.findMany({
    where: {
      scores: {
        some: {
          student: {
            classId: params.classId
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  const selectedSubjectId = searchParams.subject || subjects[0]?.id

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
              {classData.name} Leaderboard
            </h1>
            <p className="text-muted-foreground">Real-time academic performance rankings</p>
          </div>
          {session.user.role !== 'student' && (
            <Link href="/">
              <Button variant="outline" className="border-border bg-card text-foreground hover:bg-accent">
                <Home className="w-4 h-4 mr-2" />
                Classes
              </Button>
            </Link>
          )}
        </header>

        {subjects.length > 0 ? (
          <div className="space-y-8">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2">
                {subjects.map((sub) => (
                  <Link key={sub.id} href={`/${classData.id}?subject=${sub.id}`}>
                    <Button 
                      variant={selectedSubjectId === sub.id ? "default" : "outline"}
                      className={`whitespace-nowrap ${selectedSubjectId === sub.id ? 'bg-emerald-600 hover:bg-emerald-700 text-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      {sub.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading rankings...</div>}>
              <LeaderboardContent classId={classData.id} subjectId={selectedSubjectId} availableSubjects={subjects} />
            </Suspense>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            No subjects or scores found for this class.
          </div>
        )}
      </div>
    </div>
  )
}
