'use server'

import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from './auth-utils'

export interface TemplateClassOption {
  id: string
  name: string
  studentCount: number
}

export interface TemplateStudentData {
  id: string
  name: string
  rollNumber: string | null
  section: string | null
  registrationNumber: string | null
  fatherName: string | null
  fatherPhone: string | null
  fatherCnic: string | null
  className?: string
}

/**
 * Fetch available classes for the logged-in school/teacher to populate the template selector.
 */
export async function getClassesForTemplateAction(): Promise<{
  success: boolean
  classes?: TemplateClassOption[]
  error?: string
}> {
  try {
    const authRes = await requireSchoolOrTeacherAccess()
    const schoolId = authRes.schoolId
    if (!schoolId) return { success: false, error: 'Unauthorized: School ID not found' }

    const classes = await prisma.class.findMany({
      where: {
        schoolId,
        ...(authRes.isTeacher ? { id: { in: authRes.classIds } } : {})
      },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    })

    // Sort naturally: e.g. Class 1, Class 2, Class 9, Class 10
    classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

    return {
      success: true,
      classes: classes.map(c => ({
        id: c.id,
        name: c.name,
        studentCount: c._count.students
      }))
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to fetch classes' }
  }
}

/**
 * Fetch all students in a given class (or all classes) for Excel template pre-filling.
 */
export async function getStudentsForClassTemplateAction(
  classIdentifier: string
): Promise<{
  success: boolean
  className?: string
  classId?: string
  students?: TemplateStudentData[]
  error?: string
}> {
  try {
    if (!classIdentifier || classIdentifier === '__blank__') {
      return { success: true, className: 'Blank', students: [] }
    }

    const authRes = await requireSchoolOrTeacherAccess()
    const schoolId = authRes.schoolId
    if (!schoolId) return { success: false, error: 'Unauthorized: School ID not found' }

    // If '__all__', fetch all students belonging to the school (or teacher's classes)
    if (classIdentifier === '__all__') {
      const students = await prisma.student.findMany({
        where: {
          class: {
            schoolId,
            ...(authRes.isTeacher ? { id: { in: authRes.classIds } } : {})
          }
        },
        include: {
          class: true
        }
      })

      students.sort((a, b) => {
        const classComp = a.class.name.localeCompare(b.class.name, undefined, { numeric: true })
        if (classComp !== 0) return classComp

        const rollA = parseInt(a.rollNumber || '0', 10)
        const rollB = parseInt(b.rollNumber || '0', 10)
        if (!isNaN(rollA) && !isNaN(rollB) && rollA !== 0 && rollB !== 0) {
          return rollA - rollB
        }
        return (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true })
      })

      return {
        success: true,
        className: 'All_Classes',
        students: students.map(s => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          section: s.section,
          registrationNumber: s.registrationNumber,
          fatherName: s.fatherName,
          fatherPhone: s.fatherPhone,
          fatherCnic: s.fatherCnic,
          className: s.class.name
        }))
      }
    }

    // Try finding by ID first, then by exact name
    let cls = await prisma.class.findFirst({
      where: {
        schoolId,
        ...(authRes.isTeacher ? { id: { in: authRes.classIds } } : {}),
        OR: [
          { id: classIdentifier },
          { name: classIdentifier },
          { name: classIdentifier.trim() }
        ]
      }
    })

    // If not found, attempt flexible matching (e.g., "10" vs "Class 10")
    if (!cls) {
      const stripped = classIdentifier.replace(/^class\s+/i, '').replace(/^grade\s+/i, '').trim()
      cls = await prisma.class.findFirst({
        where: {
          schoolId,
          ...(authRes.isTeacher ? { id: { in: authRes.classIds } } : {}),
          OR: [
            { name: { equals: stripped, mode: 'insensitive' } },
            { name: { equals: `Class ${stripped}`, mode: 'insensitive' } },
            { name: { equals: `Grade ${stripped}`, mode: 'insensitive' } }
          ]
        }
      })
    }

    if (!cls) {
      return { success: false, error: `Class "${classIdentifier}" not found.` }
    }

    const students = await prisma.student.findMany({
      where: { classId: cls.id },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        section: true,
        registrationNumber: true,
        fatherName: true,
        fatherPhone: true,
        fatherCnic: true
      }
    })

    // Sort naturally: 1, 2, 3... 10...
    students.sort((a, b) => {
      const rollA = parseInt(a.rollNumber || '0', 10)
      const rollB = parseInt(b.rollNumber || '0', 10)
      if (!isNaN(rollA) && !isNaN(rollB) && rollA !== 0 && rollB !== 0) {
        return rollA - rollB
      }
      return (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true })
    })

    return {
      success: true,
      classId: cls.id,
      className: cls.name,
      students: students.map(s => ({
        ...s,
        className: cls!.name
      }))
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to fetch students for class' }
  }
}
