'use server'

import * as xlsx from 'xlsx'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { requireSchoolOrTeacherAccess } from './auth-utils'

function findKey(row: Record<string, any>, possibleKeys: string[]) {
  const keys = Object.keys(row)
  return keys.find(k => possibleKeys.some(pk => k.includes(pk)))
}

export async function uploadCopyCheckingAction(formData: FormData) {
  const className = formData.get('className') as string | null
  const subjectName = formData.get('subjectName') as string | null
  const checkDate = formData.get('checkDate') as string | null
  const file = formData.get('file') as File | null

  if (!file || !className || !subjectName || !checkDate) {
    return { success: false, error: 'Missing required fields' }
  }

  let schoolId: string
  try {
    const authRes = await requireSchoolOrTeacherAccess(className, undefined, subjectName)
    schoolId = authRes.schoolId
  } catch (e: any) {
    return { success: false, error: e.message }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds 10MB limit' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const rawData = xlsx.utils.sheet_to_json(worksheet, { blankrows: false })
    
    const validatedData = []
    const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype']

    for (const rawRow of rawData as any[]) {
      const row: Record<string, any> = Object.create(null)
      for (const [key, value] of Object.entries(rawRow)) {
        const cleanKey = key.toLowerCase().trim()
        if (DANGEROUS_KEYS.includes(cleanKey)) continue
        row[cleanKey] = value
      }

      const nameKey = findKey(row, ['name', 'student'])
      const rollNoKey = findKey(row, ['roll no', 'r.no', 'roll number'])
      const statusKey = findKey(row, ['status', 'copy', 'check'])

      const name = nameKey ? String(row[nameKey]).trim() : undefined
      const rollNumber = rollNoKey ? String(row[rollNoKey]).trim() : ''
      const statusRaw = statusKey ? String(row[statusKey]).trim().toUpperCase() : ''
      
      let status: 'C' | 'I' | null = null
      if (statusRaw === 'C' || statusRaw === 'COMPLETE') status = 'C'
      if (statusRaw === 'I' || statusRaw === 'INCOMPLETE') status = 'I'

      if (name && status) {
        validatedData.push({ name, rollNumber, status })
      }
    }

    if (validatedData.length === 0) {
      return { success: false, error: 'No valid data found in the uploaded file. Ensure you have Name, Roll Number, and Status (C/I) columns.' }
    }

    let messagesQueued = 0

    await prisma.$transaction(async (tx) => {
      const classRecord = await tx.class.findUnique({
        where: { name_schoolId: { name: className, schoolId } }
      })
      
      if (!classRecord) {
        throw new Error(`Class ${className} not found.`)
      }

      const formattedDate = new Date(checkDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })

      for (const data of validatedData) {
        let student = null
        
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

        if (student && student.fatherPhone) {
          let urduMessage = ''
          
          if (data.status === 'C') {
            urduMessage = `Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ki ${subjectName} ki copy mukammal (complete) hai aur check kar li gayi hai. Shabash!`
          } else if (data.status === 'I') {
            urduMessage = `Assalam o Alaikum! Aap ke bache ${student.name} (Class ${classRecord.name}) ki ${subjectName} ki copy namukammal (incomplete) hai. Barae meharbani is par tawajah dein aur bache ka kaam mukammal karwayen.`
          }

          urduMessage += '\n\nMuhammad Mashhood Tariq'

          await tx.whatsAppQueue.create({
            data: {
              studentId: student.id,
              phone: student.fatherPhone,
              message: urduMessage,
              status: 'PENDING'
            }
          })
          
          messagesQueued++
        }
      }
    }, {
      maxWait: 10000,
      timeout: 60000 
    })

    revalidatePath('/dashboard/uploads')
    return { success: true, message: `Successfully queued ${messagesQueued} messages for parents regarding copy checking.` }
  } catch (error: any) {
    console.error('Copy Checking Upload Error:', error)
    return { success: false, error: error.message || 'An error occurred during copy checking upload' }
  }
}
