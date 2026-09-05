'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export type ComprehensiveSubjectScore = {
  subjectId: string
  subjectName: string
  rawObtained: number
  rawTotal: number
  isAbsent: boolean
}

export type ComprehensiveStudentScore = {
  studentId: string
  rollNumber: string | null
  name: string
  section: string | null
  classId: string
  className: string
  subjects: ComprehensiveSubjectScore[]
}

export async function fetchComprehensiveScores(
  classId: string,
  studentIds: string[],
  selectedTests: string[],
  selectedSubjects?: string[]
): Promise<ComprehensiveStudentScore[]> {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'student' || role === 'admin') throw new Error('Forbidden: Access denied')

  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized')

  if (role === 'teacher' && !session.user.classIds?.includes(classId)) {
    throw new Error('Forbidden: You do not have access to this class')
  }

  // Fetch the students with their scores for the selected tests and subjects
  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      classId: classId,
      class: { schoolId }
    },
    include: {
      class: true,
      scores: {
        where: {
          testName: { in: selectedTests },
          ...(selectedSubjects && selectedSubjects.length > 0 ? { subject: { name: { in: selectedSubjects } } } : {})
        },
        include: {
          subject: true
        }
      }
    },
    orderBy: [
      { section: 'asc' },
      { name: 'asc' }
    ]
  })

  return students.map(student => {
    // Group scores by subject
    const subjectMap = new Map<string, { subjectName: string, obtained: number, total: number, absences: number, totalTests: number }>()

    student.scores.forEach(score => {
      if (!subjectMap.has(score.subjectId)) {
        subjectMap.set(score.subjectId, {
          subjectName: score.subject.name,
          obtained: 0,
          total: 0,
          absences: 0,
          totalTests: 0
        })
      }
      
      const subj = subjectMap.get(score.subjectId)!
      subj.totalTests += 1
      subj.obtained += score.marksObtained
      subj.total += score.totalMarks
      if (score.isAbsent) subj.absences += 1
    })

    const subjects = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.subjectName,
      rawObtained: data.obtained,
      rawTotal: data.total,
      isAbsent: data.totalTests > 0 && data.absences === data.totalTests 
    }))

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
      section: student.section,
      classId: student.classId,
      className: student.class.name,
      subjects
    }
  }).sort((a, b) => {
    const aRoll = parseInt(a.rollNumber || '0') || 0
    const bRoll = parseInt(b.rollNumber || '0') || 0
    if (aRoll !== bRoll) return aRoll - bRoll
    return a.name.localeCompare(b.name)
  })
}

export async function fetchClassSubjects(classId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'student' || role === 'admin') throw new Error('Forbidden: Access denied')

  const schoolId = role === 'school' ? session.user.id : session.user.schoolId
  if (!schoolId) throw new Error('Unauthorized')

  if (role === 'teacher' && !session.user.classIds?.includes(classId)) {
    throw new Error('Forbidden: You do not have access to this class')
  }

  // Find all subjects that have scores in this class
  const scores = await prisma.score.findMany({
    where: {
      student: { 
        classId,
        class: { schoolId }
      }
    },
    select: {
      subject: true
    },
    distinct: ['subjectId']
  })
  
  return scores.map(s => s.subject).sort((a, b) => a.name.localeCompare(b.name))
}
