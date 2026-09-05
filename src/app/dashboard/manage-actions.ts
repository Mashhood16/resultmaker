'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function fetchFilterOptions() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized: School context missing')

  const classes = await prisma.class.findMany({ 
    where: { 
      schoolId,
      ...(role === 'teacher' ? { id: { in: session.user.classIds || [] } } : {})
    }, 
    orderBy: { name: 'asc' } 
  })
  const subjects = await prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } })
  
  const testNamesResult = await prisma.score.findMany({
    where: {
      student: { 
        class: { 
          schoolId,
          ...(role === 'teacher' ? { id: { in: session.user.classIds || [] } } : {})
        } 
      }
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
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized')

  if (role === 'teacher') {
    if (!session.user.classIds?.includes(classId)) {
      throw new Error('Forbidden: You do not have access to this class')
    }
    const allowedSubjects = session.user.subjectAccess?.[classId] || []
    if (!allowedSubjects.includes(subjectId)) {
      throw new Error('Forbidden: You do not have access to this subject in this class')
    }
  }

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
  const role = session.user.role
  if (role === 'student') throw new Error('Forbidden: Students cannot modify scores')
  
  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized: School context missing')

  if (totalMarks <= 0) throw new Error('Total marks must be greater than 0')
  if (marksObtained < 0 || marksObtained > totalMarks) {
    throw new Error(`Marks obtained must be between 0 and ${totalMarks}`)
  }

  const existingScore = await prisma.score.findFirst({
    where: {
      id: scoreId,
      student: {
        class: {
          schoolId,
          ...(role === 'teacher' ? { id: { in: session.user.classIds || [] } } : {})
        }
      }
    },
    include: {
      student: {
        select: { classId: true }
      }
    }
  })

  if (!existingScore) {
    throw new Error('Score not found or access denied')
  }

  if (role === 'teacher') {
    const allowedSubjects = session.user.subjectAccess?.[existingScore.student.classId] || []
    if (!allowedSubjects.includes(existingScore.subjectId)) {
      throw new Error('Forbidden: You do not have access to manage this subject')
    }
  }

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

export async function addSingleManualScore(data: {
  classId: string
  subjectId: string
  testName: string
  studentName: string
  rollNumber?: string
  section?: string
  marksObtained: number
  totalMarks: number
  isAbsent: boolean
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'student') throw new Error('Forbidden: Students cannot add scores')

  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized')

  // Validate that the target class belongs to this school
  const targetClass = await prisma.class.findFirst({
    where: { id: data.classId, schoolId }
  })
  if (!targetClass) {
    throw new Error('Forbidden: Class not found or does not belong to your school.')
  }

  // Validate that the target subject belongs to this school
  const targetSubject = await prisma.subject.findFirst({
    where: { id: data.subjectId, schoolId }
  })
  if (!targetSubject) {
    throw new Error('Forbidden: Subject not found or does not belong to your school.')
  }

  if (role === 'teacher') {
    if (!session.user.classIds?.includes(data.classId)) {
      throw new Error('Forbidden: You are not assigned to this class')
    }
    const allowedSubjects = session.user.subjectAccess?.[data.classId]
    if (allowedSubjects && !allowedSubjects.includes(data.subjectId)) {
      throw new Error('Forbidden: You are not assigned to manage this subject in this class')
    }
  }

  const trimmedName = data.studentName?.trim()
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Student name is required and must be under 100 characters')
  }

  if (data.totalMarks <= 0) throw new Error('Total marks must be greater than 0')
  if (data.marksObtained < 0 || data.marksObtained > data.totalMarks) {
    throw new Error(`Marks obtained must be between 0 and ${data.totalMarks}`)
  }

  const percentage = data.isAbsent ? 0 : Number(((data.marksObtained / data.totalMarks) * 100).toFixed(2))

  // Find or create student
  let student = null

  if (data.rollNumber) {
    // 1. Strict match by roll number if provided
    student = await prisma.student.findFirst({
      where: {
        classId: data.classId,
        rollNumber: data.rollNumber,
        class: { schoolId }
      }
    })
  }

  if (!student) {
    // 2. Try matching by name and section
    const studentsWithName = await prisma.student.findMany({
      where: {
        classId: data.classId,
        name: data.studentName,
        section: data.section || null,
        class: { schoolId }
      }
    })
    
    if (data.rollNumber) {
      // If we provided a roll number, but no student had this roll number.
      // We found students with the exact same name. If one of them has NO roll number,
      // we can adopt them and assign this roll number.
      student = studentsWithName.find(s => s.rollNumber === null) || null
    } else {
      // If we didn't provide a roll number, just use the first student that has this name.
      student = studentsWithName[0] || null
    }
  }

  if (!student) {
    student = await prisma.student.create({
      data: {
        name: data.studentName,
        rollNumber: data.rollNumber || null,
        section: data.section || null,
        classId: data.classId,
        showInLeaderboard: true // Make visible by default when manually added
      }
    })
  } else {
    // Update roll number if missing, and always ensure they are visible on the leaderboard
    if ((data.rollNumber && !student.rollNumber) || !student.showInLeaderboard) {
      await prisma.student.update({
        where: { id: student.id },
        data: { 
          ...(data.rollNumber && !student.rollNumber ? { rollNumber: data.rollNumber } : {}),
          showInLeaderboard: true 
        }
      })
    }
  }

  // Upsert the score
  await prisma.score.upsert({
    where: {
      studentId_subjectId_testName: {
        studentId: student.id,
        subjectId: data.subjectId,
        testName: data.testName
      }
    },
    update: {
      marksObtained: data.isAbsent ? 0 : data.marksObtained,
      totalMarks: data.totalMarks,
      isAbsent: data.isAbsent,
      percentage
    },
    create: {
      studentId: student.id,
      subjectId: data.subjectId,
      testName: data.testName,
      marksObtained: data.isAbsent ? 0 : data.marksObtained,
      totalMarks: data.totalMarks,
      isAbsent: data.isAbsent,
      percentage
    }
  })

  revalidatePath('/', 'layout')
  return { success: true }
}
