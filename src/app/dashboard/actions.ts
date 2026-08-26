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
  const defaultTotalMarks = Number(formData.get('totalMarks')) || 100

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
        Total: totalKey && row[totalKey] ? row[totalKey] : defaultTotalMarks,
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
        // Attempt to intelligently map to an existing student from the master roster
        let student = null;
        
        if (data.rollNumber) {
          student = await tx.student.findFirst({
            where: { classId: classRecord.id, rollNumber: data.rollNumber }
          })
        }

        if (!student) {
          student = await tx.student.findFirst({
            where: { classId: classRecord.id, name: data.name }
          })
        }

        // If still not found, create a placeholder student to not block the upload
        if (!student) {
          student = await tx.student.create({
            data: {
              name: data.name,
              classId: classRecord.id,
              section: data.section,
              rollNumber: data.rollNumber
            }
          })
        }

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
    }, {
      maxWait: 10000,
      timeout: 60000 // 60 seconds
    })

    revalidatePath('/')
    revalidatePath('/dashboard')
    return { success: true, message: `Successfully processed ${validatedData.length} records.` }
  } catch (error: any) {
    console.error('Upload Error:', error)
    return { success: false, error: error.message || 'An error occurred during upload' }
  }
}

export async function deleteUploadedMarksAction(className: string, subjectName: string, testName: string) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Find the class and subject to get their IDs
    const classRecord = await prisma.class.findUnique({
      where: { name_schoolId: { name: className, schoolId } }
    });
    const subjectRecord = await prisma.subject.findUnique({
      where: { name_schoolId: { name: subjectName, schoolId } }
    });

    if (!classRecord || !subjectRecord) {
      return { success: true } // Already doesn't exist
    }

    // Delete all scores for this subject and test in this class
    await prisma.score.deleteMany({
      where: {
        subjectId: subjectRecord.id,
        testName: testName,
        student: {
          classId: classRecord.id
        }
      }
    })

    revalidatePath('/dashboard')
    return { success: true, message: `Deleted all scores for ${subjectName}.` }
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred while deleting' }
  }
}

export async function uploadMasterMarksAction(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) return { success: false, error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  const className = formData.get('className') as string | null
  const testName = formData.get('testName') as string | null
  const subjectTotalMarksStr = formData.get('subjectTotalMarks') as string | null
  const subjectsStr = formData.get('subjects') as string | null

  if (!file || !className || !testName || !subjectsStr || !subjectTotalMarksStr) {
    return { success: false, error: 'Missing required fields' }
  }

  const expectedSubjects = JSON.parse(subjectsStr) as string[]
  const subjectTotalMarks = JSON.parse(subjectTotalMarksStr) as Record<string, string>
  const lowerExpectedSubjects = expectedSubjects.map(s => s.toLowerCase().trim())

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const rawData = xlsx.utils.sheet_to_json(worksheet, { blankrows: false })
    const validatedData: any[] = []

    for (const rawRow of rawData as any[]) {
      const row: Record<string, any> = {}
      for (const [key, value] of Object.entries(rawRow)) {
        row[key.toLowerCase().trim()] = value
      }

      const nameKey = findKey(row, ['name of student', 'student name', 'name', 'student'])
      const sectionKey = findKey(row, ['section', 'sec', 'class section'])
      const rollNoKey = findKey(row, ['roll no.', 'roll no', 'r.no', 's.no', 'roll number'])

      const name = nameKey ? String(row[nameKey]).trim() : undefined
      const section = sectionKey ? String(row[sectionKey]).trim() : ''
      const rollNumber = rollNoKey ? String(row[rollNoKey]).trim() : ''

      if (!name) continue // Must have a name

      const studentSubjects: any[] = []

      for (let i = 0; i < expectedSubjects.length; i++) {
        const expected = expectedSubjects[i]
        const lowerExpected = lowerExpectedSubjects[i]
        
        // Find if this subject exists as a column in the row
        const subjectKey = Object.keys(row).find(k => k === lowerExpected || k.includes(lowerExpected))
        
        if (subjectKey !== undefined) {
          let obtained = row[subjectKey]
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
          }

          if (isNaN(obtained)) continue
          
          const totalMks = Number(subjectTotalMarks[expected]) || 100
          const percentage = (obtained / totalMks) * 100

          studentSubjects.push({
            subjectName: expected,
            marksObtained: obtained,
            totalMarks: totalMks,
            percentage: Number(percentage.toFixed(2)),
            isAbsent
          })
        }
      }

      if (studentSubjects.length > 0) {
        validatedData.push({
          name,
          section,
          rollNumber,
          subjects: studentSubjects
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

      // Ensure all subjects exist
      const subjectRecords: Record<string, string> = {}
      for (const sub of expectedSubjects) {
        const rec = await tx.subject.upsert({
          where: { name_schoolId: { name: sub, schoolId } },
          update: {},
          create: { name: sub, schoolId }
        })
        subjectRecords[sub] = rec.id
      }

      for (const data of validatedData) {
        let student = null;
        if (data.rollNumber) {
          student = await tx.student.findFirst({
            where: { classId: classRecord.id, rollNumber: data.rollNumber }
          })
        }
        if (!student) {
          student = await tx.student.findFirst({
            where: { classId: classRecord.id, name: data.name }
          })
        }
        if (!student) {
          student = await tx.student.create({
            data: {
              name: data.name,
              classId: classRecord.id,
              section: data.section,
              rollNumber: data.rollNumber
            }
          })
        }

        for (const sub of data.subjects) {
          const subjectId = subjectRecords[sub.subjectName]
          if (!subjectId) continue

          await tx.score.upsert({
            where: {
              studentId_subjectId_testName: {
                studentId: student.id,
                subjectId: subjectId,
                testName: testName
              }
            },
            update: {
              marksObtained: sub.marksObtained,
              totalMarks: sub.totalMarks,
              percentage: sub.percentage,
              isAbsent: sub.isAbsent
            },
            create: {
              studentId: student.id,
              subjectId: subjectId,
              testName: testName,
              marksObtained: sub.marksObtained,
              totalMarks: sub.totalMarks,
              percentage: sub.percentage,
              isAbsent: sub.isAbsent
            }
          })
        }
      }
    }, {
      maxWait: 10000,
      timeout: 60000 // 60 seconds
    })

    revalidatePath('/')
    revalidatePath('/dashboard')
    return { success: true, message: `Successfully processed ${validatedData.length} students across all subjects.` }
  } catch (error: any) {
    console.error('Master Upload Error:', error)
    return { success: false, error: error.message || 'An error occurred during master upload' }
  }
}

export async function getTestNamesForClassAction(className: string) {
  const session = await auth()
  const schoolId = session?.user?.id
  if (!schoolId) return { success: false, error: 'Unauthorized' }

  try {
    const scores = await prisma.score.findMany({
      where: {
        student: {
          class: {
            name: className,
            schoolId: schoolId
          }
        }
      },
      select: {
        testName: true
      },
      distinct: ['testName']
    })

    const testNames = scores.map(s => s.testName).sort()
    return { success: true, testNames }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Failed to fetch test names' }
  }
}
