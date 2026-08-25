'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getTestsAction() {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) return { success: false, error: 'Unauthorized' }

  try {
    const scores = await prisma.score.findMany({
      where: {
        student: { class: { schoolId } }
      },
      select: {
        testName: true,
        subject: { select: { id: true, name: true } },
        student: { select: { classId: true, class: { select: { name: true } } } }
      }
    })

    const testMap = new Map<string, any>()
    scores.forEach(s => {
      const key = `${s.student.classId}-${s.subject.id}-${s.testName}`
      if (!testMap.has(key)) {
        testMap.set(key, {
          id: key,
          testName: s.testName,
          subjectId: s.subject.id,
          subjectName: s.subject.name,
          classId: s.student.classId,
          className: s.student.class.name,
        })
      }
    })

    return { success: true, tests: Array.from(testMap.values()) }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Failed to fetch tests.' }
  }
}

export async function deleteTestAction(classId: string, subjectId: string, testName: string) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId || session?.user?.role !== 'school') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const result = await prisma.score.deleteMany({
      where: {
        testName,
        subjectId,
        student: {
          classId,
          class: { schoolId }
        }
      }
    })
    
    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath(`/${classId}`)
    return { success: true, message: `Successfully deleted ${result.count} scores.` }
  } catch (e) {
    console.error(e)
    return { success: false, error: 'Failed to delete test.' }
  }
}
