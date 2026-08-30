'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function claimTestAccess(classId: string, testId: string, name: string, rollNumber: string) {
  // Find or Create the Student based on Roll Number
  const student = await prisma.student.upsert({
    where: {
      classId_rollNumber: {
        classId,
        rollNumber
      }
    },
    update: {}, // Do not overwrite name. First person to claim the roll number sets it.
    create: {
      classId,
      rollNumber,
      name
    }
  })

  const attempt = await prisma.testAttempt.findUnique({
    where: {
      studentId_testId: {
        studentId: student.id,
        testId: testId
      }
    }
  })

  const cookieStore = cookies()
  const deviceSessionKey = `test_device_lock_${testId}`
  const existingSession = cookieStore.get(deviceSessionKey)?.value

  if (attempt) {
    // If an attempt exists, the device MUST have the correct cookie
    if (existingSession !== student.id) {
      return { error: 'Roll number already in use on another device.' }
    }
  } else {
    // New attempt - lock this device to this student for this test
    cookieStore.set(deviceSessionKey, student.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 60 * 60 * 12 // 12 hours
    })
  }

  return { success: true }
}
