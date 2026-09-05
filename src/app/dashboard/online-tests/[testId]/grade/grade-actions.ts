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

  if (attempt.testId !== data.testId) {
    throw new Error('Forbidden: Attempt does not belong to the specified test')
  }

  if (attempt.test.schoolId !== access.schoolId) {
    throw new Error('Forbidden: Attempt belongs to another school')
  }

  if (access.isTeacher) {
    if (!access.classIds.includes(attempt.test.classId)) {
      throw new Error('Forbidden: You do not have access to grade this class')
    }
    const teacherSubjects = session.user.subjectAccess?.[attempt.test.classId] || []
    if (!teacherSubjects.includes(attempt.test.subjectId)) {
      throw new Error('Forbidden: You do not have access to grade this subject')
    }
  }

  if (typeof data.obtainedMarks !== 'number' || isNaN(data.obtainedMarks) || data.obtainedMarks < 0 || data.obtainedMarks > attempt.test.totalMarks) {
    throw new Error(`Obtained marks must be between 0 and ${attempt.test.totalMarks}`)
  }

  if (data.feedback && (typeof data.feedback !== 'string' || data.feedback.length > 5000)) {
    throw new Error('Feedback must not exceed 5000 characters')
  }

  if (data.annotatedImage) {
    if (typeof data.annotatedImage !== 'string' || data.annotatedImage.length > 2 * 1024 * 1024) {
      throw new Error('Annotated image payload exceeds allowable size (2MB)')
    }
    if (!data.annotatedImage.startsWith('data:image/') && !data.annotatedImage.startsWith('/uploads/') && !data.annotatedImage.startsWith('https://')) {
      throw new Error('Invalid annotated image format')
    }
  }

  if (data.questionMarks && (!Array.isArray(data.questionMarks) || data.questionMarks.length > 200)) {
    throw new Error('Invalid question marks structure')
  }

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
