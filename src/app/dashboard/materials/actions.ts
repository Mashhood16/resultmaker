'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTeacherClassesAndSubjects() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'teacher') throw new Error('Unauthorized')

  const schoolId = session.user.schoolId!
  const classIds = session.user.classIds || []
  const subjectAccess = session.user.subjectAccess || {}

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds }, schoolId }
  })

  // We need all subjects that the teacher has access to in any class
  const allAllowedSubjectIds = Object.values(subjectAccess).flat()
  const subjects = await prisma.subject.findMany({
    where: { id: { in: allAllowedSubjectIds }, schoolId }
  })

  return { classes, subjects, subjectAccess }
}

export async function createMaterial(data: {
  title: string,
  description?: string,
  fileUrl: string,
  fileType: string,
  classId: string,
  subjectId?: string
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'teacher') throw new Error('Unauthorized')

  const schoolId = session.user.schoolId!
  const classIds = session.user.classIds || []
  const subjectAccess = session.user.subjectAccess || {}

  // Verify access
  if (!classIds.includes(data.classId)) {
    throw new Error('Unauthorized access to this class')
  }

  if (data.subjectId) {
    const allowedSubjects = subjectAccess[data.classId] || []
    if (!allowedSubjects.includes(data.subjectId)) {
      throw new Error('Unauthorized access to this subject for this class')
    }
  }

  await prisma.classMaterial.create({
    data: {
      title: data.title,
      description: data.description || null,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      classId: data.classId,
      subjectId: data.subjectId || null,
      teacherId: session.user.id
    }
  })

  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function deleteMaterial(materialId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'teacher') throw new Error('Unauthorized')

  const material = await prisma.classMaterial.findUnique({
    where: { id: materialId }
  })

  if (!material || material.teacherId !== session.user.id) {
    throw new Error('Unauthorized or material not found')
  }

  await prisma.classMaterial.delete({
    where: { id: materialId }
  })

  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function getTeacherMaterials() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'teacher') throw new Error('Unauthorized')

  return await prisma.classMaterial.findMany({
    where: { teacherId: session.user.id },
    include: {
      class: true,
      subject: true
    },
    orderBy: { createdAt: 'desc' }
  })
}
