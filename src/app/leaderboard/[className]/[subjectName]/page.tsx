import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeaderboardContent } from '../../../[classId]/leaderboard-content'
import { Suspense } from 'react'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function ClassLeaderboardPage({
  params
}: {
  params: { className: string, subjectName: string }
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/leaderboard/${params.className}/${params.subjectName}`))
  }

  // Lookup the class for the currently logged in school
  const decodedClassName = decodeURIComponent(params.className)
  const decodedSubjectName = decodeURIComponent(params.subjectName)
  
  const schoolId = session.user.role === 'school' ? session.user.id : session.user.schoolId

  if (!schoolId) {
    return <div className="p-8 text-center text-red-500">Error: School context missing for this user.</div>
  }

  const classData = await prisma.class.findFirst({
    where: { 
      schoolId: schoolId,
      name: { equals: decodedClassName, mode: 'insensitive' }
    }
  })

  if (!classData) return <div className="p-8 text-center text-red-500">Class "{decodedClassName}" not found for your school.</div>

  // Prevent teachers/students from viewing classes they don't have access to
  if ((session.user.role === 'teacher' || session.user.role === 'student') && 
      !session.user.classIds?.includes(classData.id)) {
    redirect('/dashboard')
  }

  // Find the subject
  const subjectData = await prisma.subject.findFirst({
    where: {
      schoolId: schoolId,
      name: { equals: decodedSubjectName, mode: 'insensitive' }
    }
  })

  if (!subjectData) return <div className="p-8 text-center text-red-500">Subject "{decodedSubjectName}" not found.</div>

  // Find other subjects that have scores for this class, so we can show the navigation tabs
  const subjects = await prisma.subject.findMany({
    where: {
      scores: {
        some: {
          student: {
            classId: classData.id
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Ensure the current subject is in the list of tabs, even if it has no scores yet
  if (!subjects.find(s => s.id === subjectData.id)) {
    subjects.push(subjectData)
    subjects.sort((a, b) => a.name.localeCompare(b.name))
  }

  const activeTests = await prisma.onlineTest.findMany({
    where: { classId: classData.id, isActive: true },
    include: { subject: true }
  })

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
          <Link href="/dashboard">
            <Button variant="outline" className="border-border bg-card text-foreground hover:bg-accent">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </header>

        {/* Live Tests Banner */}
        {activeTests.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Live Online Tests
              </h3>
              <p className="text-muted-foreground mt-1">There are active tests available to take right now.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {activeTests.map(test => (
                <Link key={test.id} href={`/${classData.id}/test/${test.id}`}>
                  <Button className="font-bold shadow-lg shadow-primary/20">
                    Take {test.subject.name} Test
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2">
              {subjects.map((sub) => (
                <Link key={sub.id} href={`/leaderboard/${encodeURIComponent(classData.name)}/${encodeURIComponent(sub.name)}`}>
                  <Button 
                    variant={subjectData.id === sub.id ? "default" : "outline"}
                    className={`whitespace-nowrap ${subjectData.id === sub.id ? 'bg-emerald-600 hover:bg-emerald-700 text-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    {sub.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">Loading rankings...</div>}>
            <LeaderboardContent classId={classData.id} subjectId={subjectData.id} availableSubjects={subjects} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
