import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function PublicClassLeaderboardRedirectPage({
  params
}: {
  params: { classId: string }
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
          <h2 className="text-xl font-bold text-foreground">Leaderboard Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The public leaderboard you are trying to access does not exist, or the link is invalid. Please contact the class teacher or school administrator.
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

  // Find the first subject that has scores for this class
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

  if (subjects.length > 0) {
    redirect(`/public/leaderboard/${classData.id}/${encodeURIComponent(subjects[0].id)}`)
  } else {
    // If no scores exist yet, find any subject from this school
    const anySubject = await prisma.subject.findFirst({
      where: { schoolId: classData.schoolId },
      orderBy: { name: 'asc' }
    })

    if (anySubject) {
      redirect(`/public/leaderboard/${classData.id}/${encodeURIComponent(anySubject.id)}`)
    } else {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto border border-yellow-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{classData.name} Leaderboard</h2>
            <p className="text-sm text-muted-foreground">
              No subjects or test scores have been uploaded for this class yet. Please check back later!
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
  }
}
