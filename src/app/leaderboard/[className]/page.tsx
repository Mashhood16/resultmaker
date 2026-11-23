import prisma from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'

export default async function ClassLeaderboardRedirectPage({
  params,
  searchParams
}: {
  params: { className: string }
  searchParams?: { view?: string }
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

  // Prevent teachers/students from viewing classes they don't have access to
  if ((session.user.role === 'teacher' || session.user.role === 'student') && 
      !session.user.classIds?.includes(classData.id)) {
    redirect('/dashboard')
  }

  const viewQuery = searchParams?.view ? `?view=${encodeURIComponent(searchParams.view)}` : ''
  redirect(`/leaderboard/${encodeURIComponent(classData.name)}/Overall${viewQuery}`)
}
