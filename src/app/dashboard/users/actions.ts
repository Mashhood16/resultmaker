'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'TEACHER' | 'STUDENT'
  const classIds = formData.getAll('classIds') as string[]

  if (!name || !username || !password || !role) {
    throw new Error('Missing required fields')
  }

  // Permission checks
  if (session.user.role === 'teacher') {
    if (role === 'TEACHER') {
      throw new Error('Teachers cannot create other teachers')
    }
    // Teachers can only assign classes they have access to
    const hasUnassignedClasses = classIds.some(id => !session.user.classIds?.includes(id))
    if (hasUnassignedClasses) {
      throw new Error('You can only assign classes you have access to')
    }
  } else if (session.user.role !== 'school') {
    throw new Error('Unauthorized')
  }

  // Get the schoolId
  const schoolId = session.user.role === 'school' ? session.user.id : session.user.schoolId

  if (!schoolId) {
    throw new Error('School ID not found')
  }

  // Validate that all assigned classIds belong to this school
  if (classIds.length > 0) {
    const verifiedClasses = await prisma.class.findMany({
      where: {
        id: { in: classIds },
        schoolId: schoolId
      },
      select: { id: true }
    })
    if (verifiedClasses.length !== classIds.length) {
      throw new Error('One or more selected classes do not belong to your school.')
    }
  }

  // Check if username exists
  const existingUser = await prisma.user.findUnique({
    where: { username }
  })
  
  const existingSchool = await prisma.school.findUnique({
    where: { username }
  })

  if (existingUser || existingSchool) {
    throw new Error('Username already exists')
  }

  const passwordHash = await hash(password, 10)

  const subjectAccess: { classId: string, subjectId: string }[] = []
  if (role === 'TEACHER') {
    classIds.forEach(classId => {
      const subjects = formData.getAll(`subjectAccess_${classId}`) as string[]
      subjects.forEach(subjectId => {
        subjectAccess.push({ classId, subjectId })
      })
    })

    if (subjectAccess.length > 0) {
      const allSubjectIds = Array.from(new Set(subjectAccess.map(sa => sa.subjectId)))
      const verifiedSubjects = await prisma.subject.findMany({
        where: {
          id: { in: allSubjectIds },
          schoolId: schoolId
        },
        select: { id: true }
      })
      if (verifiedSubjects.length !== allSubjectIds.length) {
        throw new Error('One or more selected subjects do not belong to your school.')
      }
    }
  }

  await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role,
      schoolId,
      classes: {
        connect: classIds.map(id => ({ id }))
      },
      subjectAccess: {
        create: subjectAccess.map(sa => ({
          classId: sa.classId,
          subjectId: sa.subjectId
        }))
      }
    }
  })

  revalidatePath('/dashboard/users')
}

export async function deleteUser(userId: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { classes: true }
  })

  if (!targetUser) {
    throw new Error('User not found')
  }

  // Permission checks
  if (session.user.role === 'teacher') {
    if (targetUser.schoolId !== session.user.schoolId) {
      throw new Error('Forbidden: You can only manage users in your school')
    }

    if (targetUser.role === 'TEACHER') {
      throw new Error('Teachers cannot delete other teachers')
    }
    
    // Teachers can only delete students if they share a class
    const sharesClass = targetUser.classes.some(c => session.user.classIds?.includes(c.id))
    if (!sharesClass) {
      throw new Error('You can only manage students in your assigned classes')
    }
  } else if (session.user.role === 'school') {
    if (targetUser.schoolId !== session.user.id) {
      throw new Error('Forbidden: Cannot delete users from another school')
    }
  } else if (session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath('/dashboard/users')
}
