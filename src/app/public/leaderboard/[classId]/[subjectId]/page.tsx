import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Suspense } from 'react'
import { GraduationCap, Globe, Lock, LogIn, AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeaderboardContent } from '@/app/[classId]/leaderboard-content'
import { ShareLeaderboardModal } from '@/components/share-leaderboard-modal'

export const dynamic = 'force-dynamic'

export default async function PublicClassLeaderboardPage({
  params
}: {
  params: { classId: string, subjectId: string }
}) {
  const classData = await prisma.class.findUnique({
    where: { id: params.classId },
    include: {
      school: {
        select: { id: true, name: true }
      }
    }
  })

  if (!classData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Class Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The requested class leaderboard does not exist or the link is invalid.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" className="border-border">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Find the subject either by ID or by name
  const decodedSubject = decodeURIComponent(params.subjectId)
  const subjectData = await prisma.subject.findFirst({
    where: {
      schoolId: classData.schoolId,
      OR: [
        { id: decodedSubject },
        { name: { equals: decodedSubject, mode: 'insensitive' } }
      ]
    }
  })

  if (!subjectData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Subject Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested subject could not be located for this class.
          </p>
          <div className="pt-2">
            <Link href={`/public/leaderboard/${classData.id}`}>
              <Button variant="outline" className="border-border">
                View Class Overview
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Find all subjects that have scores for this class, so we can show navigation tabs
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

  // Ensure the current subject is included in the list of tabs
  if (!subjects.find(s => s.id === subjectData.id)) {
    subjects.push(subjectData)
    subjects.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Check for active online tests that students can take
  const activeTests = await prisma.onlineTest.findMany({
    where: { classId: classData.id, isActive: true },
    include: { subject: true }
  })

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Public Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/60 border border-border/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" />
                {classData.school?.name || 'School'}
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0.5 px-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Public Access
              </Badge>
              <Badge variant="outline" className="bg-zinc-500/10 text-muted-foreground border-border text-xs py-0.5 px-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Read-Only
              </Badge>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              {classData.name} Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Official academic performance rankings & test score breakdowns
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <ShareLeaderboardModal
              classId={classData.id}
              className={classData.name}
              schoolName={classData.school?.name}
              buttonText="Share Link"
            />
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Staff Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Live Tests Banner */}
        {activeTests.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                Live Online Tests Active
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Students can enter their access PIN to begin taking their scheduled tests online.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {activeTests.map(test => (
                <Link key={test.id} href={`/${classData.id}/test/${test.id}`}>
                  <Button className="font-bold shadow-lg shadow-primary/20 rounded-xl">
                    Take {test.subject.name} Test
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Subject Navigation Tabs & Content */}
        <div className="space-y-6">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2">
              {subjects.map((sub) => {
                const isActive = subjectData.id === sub.id
                return (
                  <Link 
                    key={sub.id} 
                    href={`/public/leaderboard/${classData.id}/${encodeURIComponent(sub.id)}`}
                  >
                    <Button 
                      variant={isActive ? "default" : "outline"}
                      className={`whitespace-nowrap rounded-xl transition-all ${
                        isActive 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-foreground border-transparent shadow-md' 
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sub.name}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <Suspense fallback={
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm animate-pulse">Loading real-time rankings...</p>
            </div>
          }>
            <LeaderboardContent 
              classId={classData.id} 
              subjectId={subjectData.id} 
              availableSubjects={subjects} 
              isReadOnly={true}
            />
          </Suspense>
        </div>

        {/* Footer info */}
        <footer className="pt-8 pb-12 text-center text-xs text-muted-foreground border-t border-border/40">
          <p>This is a read-only public view provided by CendroClass for students and parents.</p>
        </footer>
      </div>
    </div>
  )
}
