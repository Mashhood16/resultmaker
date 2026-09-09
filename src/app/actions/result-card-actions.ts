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

export type ComprehensiveTestScore = {
  testName: string
  rawObtained: number
  rawTotal: number
  percentage: number
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
  tests: ComprehensiveTestScore[]
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

  if (!classId || typeof classId !== 'string' || classId.length > 100) {
    throw new Error('Invalid class ID')
  }

  if (!Array.isArray(studentIds) || studentIds.length === 0 || studentIds.length > 500) {
    throw new Error('Please select between 1 and 500 students.')
  }

  if (!Array.isArray(selectedTests) || selectedTests.length === 0 || selectedTests.length > 100) {
    throw new Error('Please select between 1 and 100 tests.')
  }

  if (selectedSubjects && (!Array.isArray(selectedSubjects) || selectedSubjects.length > 100)) {
    throw new Error('Invalid subject filter list.')
  }

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

    // Group scores by testName
    const testMap = new Map<string, { testName: string, obtained: number, total: number, absences: number, count: number }>()

    student.scores.forEach(score => {
      // Subject-level aggregation
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

      // Test-level aggregation across selected subjects
      if (!testMap.has(score.testName)) {
        testMap.set(score.testName, {
          testName: score.testName,
          obtained: 0,
          total: 0,
          absences: 0,
          count: 0
        })
      }

      const t = testMap.get(score.testName)!
      t.count += 1
      t.obtained += score.marksObtained
      t.total += score.totalMarks
      if (score.isAbsent) t.absences += 1
    })

    const subjects = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.subjectName,
      rawObtained: data.obtained,
      rawTotal: data.total,
      isAbsent: data.totalTests > 0 && data.absences === data.totalTests 
    }))

    // Build test scores matching the exact ordering of selectedTests
    const tests = selectedTests.map(testName => {
      const data = testMap.get(testName)
      if (!data) {
        return {
          testName,
          rawObtained: 0,
          rawTotal: 0,
          percentage: 0,
          isAbsent: true
        }
      }
      return {
        testName,
        rawObtained: data.obtained,
        rawTotal: data.total,
        percentage: data.total > 0 ? Number(((data.obtained / data.total) * 100).toFixed(2)) : 0,
        isAbsent: data.count > 0 && data.absences === data.count
      }
    })

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
      section: student.section,
      classId: student.classId,
      className: student.class.name,
      subjects,
      tests
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
