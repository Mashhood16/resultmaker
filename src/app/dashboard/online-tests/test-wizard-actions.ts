'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from '../auth-utils'

export async function createOnlineTest(data: {
  title: string
  testName: string
  totalMarks: number
  classId: string
  subjectId: string
  variants: { name: string; accessPin: string; content: string }[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const access = await requireSchoolOrTeacherAccess()
  if (!access) throw new Error('Forbidden')

  if (access.isTeacher && !access.classIds.includes(data.classId)) {
    throw new Error('You do not have access to this class')
  }

  const test = await prisma.onlineTest.create({
    data: {
      title: data.title,
      testName: data.testName,
      totalMarks: data.totalMarks,
      schoolId: session.user.schoolId,
      teacherId: session.user.id,
      classId: data.classId,
      subjectId: data.subjectId,
      isActive: true,
      variants: {
        create: data.variants.map(v => ({
          name: v.name,
          accessPin: v.accessPin,
          content: v.content,
        }))
      }
    }
  })

  return test.id
}
