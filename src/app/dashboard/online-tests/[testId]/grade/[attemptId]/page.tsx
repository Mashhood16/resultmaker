import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from '../../../../auth-utils'
import GradingClient from './grading-client'

export const dynamic = 'force-dynamic'

export default async function GradingPage({ params }: { params: { testId: string, attemptId: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const access = await requireSchoolOrTeacherAccess()
  if (!access) redirect('/dashboard')

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: {
      test: true,
      student: true,
      variant: true
    }
  })

  if (!attempt) redirect(`/dashboard/online-tests/${params.testId}/grade`)

  // Enforce tenant isolation
  if (attempt.test.schoolId !== access.schoolId) {
    redirect('/dashboard/online-tests')
  }

  // Teacher class assignment verification
  if (access.isTeacher && !access.classIds.includes(attempt.test.classId)) {
    redirect('/dashboard/online-tests')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      <GradingClient attempt={attempt} test={attempt.test} variant={attempt.variant} student={attempt.student} />
    </div>
  )
}
