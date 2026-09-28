'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTeacherClassesAndSubjects() {
  const session = await auth()
  if (!session?.user || !['teacher', 'school'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }

  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId!

  if (role === 'school') {
    const classes = await prisma.class.findMany({ where: { schoolId } })
    const subjects = await prisma.subject.findMany({ where: { schoolId } })
    
    // Create an access map giving school admin access to all subjects for all classes
    const subjectAccess: Record<string, string[]> = {}
    classes.forEach(c => {
      subjectAccess[c.id] = subjects.map(s => s.id)
    })
    
    return { classes, subjects, subjectAccess }
  }

  const classIds = session.user.classIds || []
  const subjectAccess = session.user.subjectAccess || {}

  const classes = await prisma.class.findMany({
    where: { id: { in: classIds }, schoolId }
  })

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
  subjectId?: string,
  resourceType: string,
  chapter?: string,
  topic?: string
}) {
  const session = await auth()
  if (!session?.user || !['teacher', 'school'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }

  const role = session.user.role

  if (role === 'teacher') {
    const classIds = session.user.classIds || []
    const subjectAccess = session.user.subjectAccess || {}

    if (!classIds.includes(data.classId)) {
      throw new Error('Unauthorized access to this class')
    }

    if (data.subjectId) {
      const allowedSubjects = subjectAccess[data.classId] || []
      if (!allowedSubjects.includes(data.subjectId)) {
        throw new Error('Unauthorized access to this subject for this class')
      }
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
      resourceType: data.resourceType,
      chapter: data.chapter || null,
      topic: data.topic || null,
      teacherId: role === 'teacher' ? session.user.id : null,
      schoolId: role === 'school' ? session.user.id : session.user.schoolId
    }
  })

  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function deleteMaterial(materialId: string) {
  const session = await auth()
  if (!session?.user || !['teacher', 'school'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }

  const material = await prisma.classMaterial.findUnique({
    where: { id: materialId },
    include: { class: true }
  })

  if (!material) throw new Error('Material not found')

  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  if (role === 'school') {
    if (material.class.schoolId !== schoolId) {
      throw new Error('Unauthorized')
    }
  } else {
    if (material.teacherId !== session.user.id) {
      throw new Error('Unauthorized')
    }
  }

  await prisma.classMaterial.delete({
    where: { id: materialId }
  })

  revalidatePath('/dashboard/materials')
  return { success: true }
}

export async function getTeacherMaterials() {
  const session = await auth()
  if (!session?.user || !['teacher', 'school'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }

  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId

  if (role === 'school') {
    return await prisma.classMaterial.findMany({
      where: { class: { schoolId } },
      include: { class: true, subject: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  return await prisma.classMaterial.findMany({
    where: { teacherId: session.user.id },
    include: { class: true, subject: true },
    orderBy: { createdAt: 'desc' }
  })
}
