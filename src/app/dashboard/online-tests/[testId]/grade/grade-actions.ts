'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from '../../../auth-utils'

export async function submitGrade(data: {
  attemptId: string
  testId: string
  obtainedMarks: number
  feedback?: string
  annotatedImage?: string
  questionMarks?: string[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const access = await requireSchoolOrTeacherAccess()
  if (!access) throw new Error('Forbidden')

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: data.attemptId },
    include: { test: true, student: true }
  })

  if (!attempt) throw new Error('Attempt not found')

  // Update Test Attempt
  await prisma.testAttempt.update({
    where: { id: data.attemptId },
    data: {
      status: 'GRADED',
      obtainedMarks: data.obtainedMarks,
      feedback: data.feedback,
      questionMarks: data.questionMarks ? JSON.stringify(data.questionMarks) : null,
      ...(data.annotatedImage ? { annotatedImage: data.annotatedImage } : {})
    }
  })

  // Upsert the Score for the Leaderboard
  const percentage = (data.obtainedMarks / attempt.test.totalMarks) * 100

  await prisma.score.upsert({
    where: {
      studentId_subjectId_testName: {
        studentId: attempt.studentId,
        subjectId: attempt.test.subjectId,
        testName: attempt.test.testName
      }
    },
    update: {
      marksObtained: data.obtainedMarks,
      totalMarks: attempt.test.totalMarks,
      percentage: percentage,
      isAbsent: false
    },
    create: {
      studentId: attempt.studentId,
      subjectId: attempt.test.subjectId,
      testName: attempt.test.testName,
      marksObtained: data.obtainedMarks,
      totalMarks: attempt.test.totalMarks,
      percentage: percentage,
      isAbsent: false
    }
  })
}
