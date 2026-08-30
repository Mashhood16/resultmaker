import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import TestTakingClient from './test-taking-client'

export const dynamic = 'force-dynamic'

export default async function TakeTestPage({ 
  params 
}: { 
  params: { classId: string, testId: string, variantId: string } 
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'student') redirect('/login')

  const test = await prisma.onlineTest.findUnique({
    where: { id: params.testId },
    include: {
      variants: {
        where: { id: params.variantId }
      }
    }
  })

  if (!test || !test.isActive || test.variants.length === 0) {
    redirect(`/${params.classId}`)
  }

  // Get student ID
  // Username for student is `schoolUsername_student_rollNumber`
  const schoolPrefix = session.user.username.split('_')[0]
  const rollNumber = session.user.username.split('_')[2]

  const school = await prisma.school.findUnique({ where: { username: schoolPrefix } })
  if (!school) redirect('/login')

  const student = await prisma.student.findUnique({
    where: {
      classId_rollNumber: {
        classId: params.classId,
        rollNumber: rollNumber
      }
    }
  })

  if (!student) {
    throw new Error('Student profile not found')
  }

  // Find or create TestAttempt
  let attempt = await prisma.testAttempt.findUnique({
    where: {
      studentId_testId: {
        studentId: student.id,
        testId: test.id
      }
    }
  })

  if (attempt && attempt.status === 'SUBMITTED') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col p-8 text-center bg-background">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Test Already Submitted</h1>
        <p className="text-muted-foreground">You have already completed this test.</p>
      </div>
    )
  }
  
  if (attempt && attempt.status === 'GRADED') {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col p-8 text-center bg-background">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Test Graded</h1>
        <p className="text-muted-foreground">Your test has been graded by the teacher.</p>
        <p className="font-bold text-primary text-2xl mt-4">Score: {attempt.obtainedMarks} / {test.totalMarks}</p>
        {attempt.annotatedImage && (
          <img src={attempt.annotatedImage} alt="Graded Test" className="mt-8 max-w-4xl border shadow-xl rounded-xl" />
        )}
      </div>
    )
  }

  if (!attempt) {
    attempt = await prisma.testAttempt.create({
      data: {
        studentId: student.id,
        testId: test.id,
        variantId: params.variantId,
        status: 'IN_PROGRESS',
        answers: ''
      }
    })
  } else if (attempt.variantId !== params.variantId) {
    // Prevent them from using a different variant if they already started one
    redirect(`/${params.classId}/test/${params.testId}`)
  }

  return (
    <TestTakingClient 
      attempt={attempt} 
      test={test} 
      variant={test.variants[0]} 
    />
  )
}
