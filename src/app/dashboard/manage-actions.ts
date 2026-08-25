'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function fetchFilterOptions() {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) throw new Error('Unauthorized')

  const classes = await prisma.class.findMany({ where: { schoolId }, orderBy: { name: 'asc' } })
  const subjects = await prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } })
  
  const testNamesResult = await prisma.score.findMany({
    where: {
      student: { class: { schoolId } }
    },
    select: { testName: true },
    distinct: ['testName'],
    orderBy: { testName: 'asc' }
  })
  
  const testNames = testNamesResult.map(t => t.testName)

  return { classes, subjects, testNames }
}

export async function fetchScores(classId: string, subjectId: string, testName: string) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) throw new Error('Unauthorized')

  if (!classId || !subjectId || !testName) return []

  const scores = await prisma.score.findMany({
    where: {
      subjectId,
      testName,
      student: { 
        classId,
        class: { schoolId }
      }
    },
    include: {
      student: true
    },
    orderBy: {
      student: { name: 'asc' }
    }
  })

  return scores.map(s => ({
    id: s.id,
    studentId: s.student.id,
    studentName: s.student.name,
    rollNumber: s.student.rollNumber,
    section: s.student.section,
    marksObtained: s.marksObtained,
    totalMarks: s.totalMarks,
    isAbsent: s.isAbsent,
    percentage: s.percentage
  }))
}

export async function updateScore(scoreId: string, marksObtained: number, totalMarks: number, isAbsent: boolean) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  if (totalMarks <= 0) throw new Error('Total marks must be greater than 0')

  const percentage = isAbsent ? 0 : Number(((marksObtained / totalMarks) * 100).toFixed(2))

  await prisma.score.update({
    where: { id: scoreId },
    data: {
      marksObtained: isAbsent ? 0 : marksObtained,
      totalMarks,
      isAbsent,
      percentage
    }
  })

  // Since we updated a score, we must revalidate the leaderboards
  revalidatePath('/', 'layout')
  
  return { success: true }
}
