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

  // Validate basic fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0 || data.title.length > 200) {
    throw new Error('Test title is required and must not exceed 200 characters.')
  }
  if (!data.testName || typeof data.testName !== 'string' || data.testName.trim().length === 0 || data.testName.length > 100) {
    throw new Error('Test name/topic is required and must not exceed 100 characters.')
  }
  if (typeof data.totalMarks !== 'number' || data.totalMarks < 1 || data.totalMarks > 1000) {
    throw new Error('Total marks must be a number between 1 and 1000.')
  }
  if (!Array.isArray(data.variants) || data.variants.length === 0 || data.variants.length > 20) {
    throw new Error('A test must contain between 1 and 20 variants.')
  }

  for (let i = 0; i < data.variants.length; i++) {
    const v = data.variants[i]
    if (!v.name || typeof v.name !== 'string' || v.name.length > 50) {
      throw new Error(`Variant ${i + 1}: Name is required and must not exceed 50 characters.`)
    }
    if (!v.accessPin || typeof v.accessPin !== 'string' || v.accessPin.trim().length === 0 || v.accessPin.length > 50) {
      throw new Error(`Variant ${i + 1}: Access PIN is required and must not exceed 50 characters.`)
    }
    if (typeof v.content !== 'string' || v.content.length > 500 * 1024) {
      throw new Error(`Variant ${i + 1}: Content exceeds maximum allowable size (500KB).`)
    }
  }

  if (access.isTeacher) {
    if (!access.classIds.includes(data.classId)) {
      throw new Error('You do not have access to this class')
    }
    const teacherSubjects = session.user.subjectAccess?.[data.classId] || []
    if (!teacherSubjects.includes(data.subjectId)) {
      throw new Error('You do not have access to create tests for this subject')
    }
  }

  // Validate that the target class and subject belong to this school
  const targetClass = await prisma.class.findFirst({
    where: { id: data.classId, schoolId: access.schoolId }
  })
  if (!targetClass) throw new Error('Class not found in your school')

  const targetSubject = await prisma.subject.findFirst({
    where: { id: data.subjectId, schoolId: access.schoolId }
  })
  if (!targetSubject) throw new Error('Subject not found in your school')

  const test = await prisma.onlineTest.create({
    data: {
      title: data.title.trim(),
      testName: data.testName.trim(),
      totalMarks: data.totalMarks,
      schoolId: access.schoolId,
      teacherId: session.user.role === 'teacher' ? session.user.id : null,
      classId: data.classId,
      subjectId: data.subjectId,
      isActive: true,
      variants: {
        create: data.variants.map(v => ({
          name: v.name.trim(),
          accessPin: v.accessPin.trim(),
          content: v.content,
        }))
      }
    }
  })

  return test.id
}
