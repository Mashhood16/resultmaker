'use server'

import * as xlsx from 'xlsx'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

function findKey(row: Record<string, any>, possibleKeys: string[]) {
  const keys = Object.keys(row)
  return keys.find(k => possibleKeys.some(pk => k.includes(pk)))
}

const rosterRowSchema = z.object({
  Name: z.string().min(1),
  ClassName: z.string().optional().default(''),
  RegistrationNumber: z.string().optional().default(''),
  RollNumber: z.string().optional().default(''),
  Section: z.string().optional().default(''),
  FatherName: z.string().optional().default(''),
  FatherPhone: z.string().optional().default(''),
  FatherCnic: z.string().optional().default(''),
})

export async function uploadStudentRosterAction(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) {
    return { success: false, error: 'Unauthorized' }
  }

  const file = formData.get('file') as File | null
  const defaultClassName = formData.get('className') as string | null

  if (!file) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const rawData = xlsx.utils.sheet_to_json(worksheet, { blankrows: false })
    const validatedData = []

    for (const rawRow of rawData as any[]) {
      const row: Record<string, any> = {}
      for (const [key, value] of Object.entries(rawRow)) {
        row[key.toLowerCase().trim()] = value
      }

      // Flexible column mapping
      const nameKey = findKey(row, ['name', 'student', 'student name'])
      const classKey = findKey(row, ['class', 'grade'])
      const regNoKey = findKey(row, ['reg no', 'registration', 'reg. no', 'reg number'])
      const rollNoKey = findKey(row, ['roll no', 'roll number', 'r.no', 'class roll'])
      const sectionKey = findKey(row, ['section', 'sec'])
      const fatherNameKey = findKey(row, ['father name', "father's name", 'parent name'])
      const fatherPhoneKey = findKey(row, ['phone', 'contact', 'mobile', 'father phone', 'parent phone'])
      const fatherCnicKey = findKey(row, ['cnic', 'id card', 'father cnic', 'parent cnic'])

      const parsedRow = rosterRowSchema.safeParse({
        Name: nameKey ? String(row[nameKey]) : undefined,
        ClassName: classKey ? String(row[classKey]) : (defaultClassName || ''),
        RegistrationNumber: regNoKey ? String(row[regNoKey]) : '',
        RollNumber: rollNoKey ? String(row[rollNoKey]) : '',
        Section: sectionKey ? String(row[sectionKey]) : '',
        FatherName: fatherNameKey ? String(row[fatherNameKey]) : '',
        FatherPhone: fatherPhoneKey ? String(row[fatherPhoneKey]) : '',
        FatherCnic: fatherCnicKey ? String(row[fatherCnicKey]) : '',
      })

      if (parsedRow.success && parsedRow.data.ClassName.trim()) {
        validatedData.push({
          name: parsedRow.data.Name.trim(),
          className: parsedRow.data.ClassName.trim(),
          registrationNumber: parsedRow.data.RegistrationNumber.trim() || null,
          rollNumber: parsedRow.data.RollNumber.trim() || null,
          section: parsedRow.data.Section.trim() || null,
          fatherName: parsedRow.data.FatherName.trim() || null,
          fatherPhone: parsedRow.data.FatherPhone.trim() || null,
          fatherCnic: parsedRow.data.FatherCnic.trim() || null,
        })
      }
    }

    if (validatedData.length === 0) {
      return { success: false, error: 'No valid data found in the uploaded file. Make sure every row has a Name and Class (or you provided a default Class).' }
    }

    await prisma.$transaction(async (tx) => {
      // cache classes
      const classCache = new Map<string, any>()

      for (const data of validatedData) {
        let classRecord = classCache.get(data.className)
        if (!classRecord) {
          classRecord = await tx.class.upsert({
            where: { name_schoolId: { name: data.className, schoolId } },
            update: {},
            create: { name: data.className, schoolId }
          })
          classCache.set(data.className, classRecord)
        }

        // We upsert by Name, Class, and Section as the unique identifier
        await tx.student.upsert({
          where: {
            name_classId_section: {
              name: data.name,
              classId: classRecord.id,
              section: data.section || ''
            }
          },
          update: {
            registrationNumber: data.registrationNumber,
            rollNumber: data.rollNumber,
            fatherName: data.fatherName,
            fatherPhone: data.fatherPhone,
            fatherCnic: data.fatherCnic,
          },
          create: {
            name: data.name,
            classId: classRecord.id,
            section: data.section || '',
            registrationNumber: data.registrationNumber,
            rollNumber: data.rollNumber,
            fatherName: data.fatherName,
            fatherPhone: data.fatherPhone,
            fatherCnic: data.fatherCnic,
          }
        })
      }
    })

    revalidatePath('/dashboard')
    return { success: true, message: `Successfully registered ${validatedData.length} students.` }
  } catch (error: any) {
    console.error('Upload Roster Error:', error)
    return { success: false, error: error.message || 'An error occurred during upload' }
  }
}

export async function deleteStudentAction(studentId: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prisma.student.delete({
      where: { id: studentId }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getStudentsBySchool(schoolId: string) {
  return await prisma.student.findMany({
    where: {
      class: {
        schoolId: schoolId
      }
    },
    include: {
      class: true
    },
    orderBy: [
      { class: { name: 'asc' } },
      { name: 'asc' }
    ]
  })
}

export async function editStudentAction(studentId: string, data: {
  name: string
  registrationNumber: string
  rollNumber: string
  section: string
  fatherName: string
  fatherPhone: string
  fatherCnic: string
}) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        name: data.name.trim(),
        registrationNumber: data.registrationNumber.trim() || null,
        rollNumber: data.rollNumber.trim() || null,
        section: data.section.trim() || null,
        fatherName: data.fatherName.trim() || null,
        fatherPhone: data.fatherPhone.trim() || null,
        fatherCnic: data.fatherCnic.trim() || null,
      }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function bulkMoveStudentsAction(studentIds: string[], targetClassName: string) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) return { success: false, error: 'Unauthorized' }

  if (!targetClassName || studentIds.length === 0) {
    return { success: false, error: 'Missing target class or selected students.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Find or create the target class
      const targetClass = await tx.class.upsert({
        where: { name_schoolId: { name: targetClassName.trim(), schoolId } },
        update: {},
        create: { name: targetClassName.trim(), schoolId }
      })

      // Move all selected students to the new class
      await tx.student.updateMany({
        where: {
          id: { in: studentIds }
        },
        data: {
          classId: targetClass.id
        }
      })
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleStudentVisibilityAction(studentId: string, isVisible: boolean) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        showInLeaderboard: isVisible
      }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function bulkToggleVisibilityAction(studentIds: string[], isVisible: boolean) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  if (studentIds.length === 0) {
    return { success: false, error: 'No students selected.' }
  }

  try {
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds }
      },
      data: {
        showInLeaderboard: isVisible
      }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
