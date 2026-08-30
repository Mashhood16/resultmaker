import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import TestTakingClient from './test-taking-client'

export const dynamic = 'force-dynamic'

export default async function TakeTestPage({ 
  params,
  searchParams
}: { 
  params: { classId: string, testId: string, variantId: string } 
  searchParams: { roll: string, name: string }
}) {
  const { roll, name } = searchParams

  if (!roll || !name) {
    redirect(`/${params.classId}/test/${params.testId}`)
  }

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

  // Find or Create the Student based on Roll Number
  const student = await prisma.student.upsert({
    where: {
      classId_rollNumber: {
        classId: params.classId,
        rollNumber: roll
      }
    },
    update: {}, // Do not overwrite name. First person to claim the roll number sets it.
    create: {
      classId: params.classId,
      rollNumber: roll,
      name: name
    }
  })

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
