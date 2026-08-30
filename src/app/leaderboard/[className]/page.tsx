import prisma from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'

export default async function ClassLeaderboardRedirectPage({
  params
}: {
  params: { className: string }
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/leaderboard/${params.className}`))
  }

  const decodedClassName = decodeURIComponent(params.className)
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

  if (!classData) return notFound()

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
    redirect(`/leaderboard/${encodeURIComponent(classData.name)}/${encodeURIComponent(subjects[0].name)}`)
  } else {
    // If no subjects have scores, just pick the first subject from the school
    const anySubject = await prisma.subject.findFirst({
      where: { schoolId },
      orderBy: { name: 'asc' }
    })
    
    if (anySubject) {
      redirect(`/leaderboard/${encodeURIComponent(classData.name)}/${encodeURIComponent(anySubject.name)}`)
    } else {
      return <div className="p-8 text-center text-muted-foreground">No subjects found for this school.</div>
    }
  }
}
