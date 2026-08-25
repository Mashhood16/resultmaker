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

const rowSchema = z.object({
  Name: z.string().min(1),
  Section: z.string().optional().default(''),
  RollNumber: z.string().optional().default(''),
  Obtained: z.any(),
  Total: z.coerce.number(),
})

export async function uploadMarksAction(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) {
    return { success: false, error: 'Unauthorized' }
  }

  const file = formData.get('file') as File | null
  const className = formData.get('className') as string | null
  const subjectName = formData.get('subjectName') as string | null
  const testName = formData.get('testName') as string | null

  if (!file || !className || !subjectName || !testName) {
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

      const nameKey = findKey(row, ['name of student', 'student name', 'name', 'student'])
      const sectionKey = findKey(row, ['section', 'sec', 'class section'])
      const rollNoKey = findKey(row, ['roll no.', 'roll no', 'r.no', 's.no', 'roll number'])
      const obtainedKey = findKey(row, ['obtained marks', 'marks obtained', 'obtained', 'score', 'marks'])
      const totalKey = findKey(row, ['total marks', 'total', 'out of'])

      const parsedRow = rowSchema.safeParse({
        Name: nameKey ? String(row[nameKey]) : undefined,
        Section: sectionKey ? String(row[sectionKey]) : '',
        RollNumber: rollNoKey ? String(row[rollNoKey]) : '',
        Obtained: obtainedKey ? row[obtainedKey] : undefined,
        Total: totalKey ? row[totalKey] : undefined,
      })

      if (parsedRow.success) {
        let obtained = parsedRow.data.Obtained
        let isAbsent = false

        if (typeof obtained === 'string') {
          const lower = obtained.toLowerCase().trim()
          if (lower === 'a' || lower === 'absent') {
            isAbsent = true
            obtained = 0
          } else if (lower === 'zero' || lower === '00') {
            obtained = 0
          } else {
            obtained = parseFloat(obtained)
          }
        } else if (typeof obtained === 'number') {
          // Keep as is
        } else {
          continue 
        }

        if (isNaN(obtained)) continue

        const total = parsedRow.data.Total
        if (total <= 0) continue

        const percentage = (obtained / total) * 100

        validatedData.push({
          name: parsedRow.data.Name.trim(),
          section: parsedRow.data.Section.trim(),
          rollNumber: parsedRow.data.RollNumber ? parsedRow.data.RollNumber.trim() : null,
          marksObtained: obtained,
          totalMarks: total,
          percentage: Number(percentage.toFixed(2)),
          isAbsent
        })
      }
    }

    if (validatedData.length === 0) {
      return { success: false, error: 'No valid data found in the uploaded file' }
    }

    await prisma.$transaction(async (tx) => {
      const classRecord = await tx.class.upsert({
        where: { name_schoolId: { name: className, schoolId } },
        update: {},
        create: { name: className, schoolId }
      })

      const subjectRecord = await tx.subject.upsert({
        where: { name_schoolId: { name: subjectName, schoolId } },
        update: {},
        create: { name: subjectName, schoolId }
      })

      for (const data of validatedData) {
        const student = await tx.student.upsert({
          where: {
            name_classId_section: {
              name: data.name,
              classId: classRecord.id,
              section: data.section
            }
          },
          update: {
            rollNumber: data.rollNumber !== null ? data.rollNumber : undefined
          },
          create: {
            name: data.name,
            classId: classRecord.id,
            section: data.section,
            rollNumber: data.rollNumber
          }
        })

        await tx.score.upsert({
          where: {
            studentId_subjectId_testName: {
              studentId: student.id,
              subjectId: subjectRecord.id,
              testName: testName
            }
          },
          update: {
            marksObtained: data.marksObtained,
            totalMarks: data.totalMarks,
            percentage: data.percentage,
            isAbsent: data.isAbsent
          },
          create: {
            studentId: student.id,
            subjectId: subjectRecord.id,
            testName: testName,
            marksObtained: data.marksObtained,
            totalMarks: data.totalMarks,
            percentage: data.percentage,
            isAbsent: data.isAbsent
          }
        })
      }
    })

    revalidatePath('/')
    revalidatePath(`/${className}`) // Just to be safe, though we might use classId
    return { success: true, message: `Successfully processed ${validatedData.length} records.` }
  } catch (error: any) {
    console.error('Upload Error:', error)
    return { success: false, error: error.message || 'An error occurred during upload' }
  }
}
