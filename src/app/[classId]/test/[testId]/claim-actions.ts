'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function claimTestAccess(classId: string, testId: string, name: string, rollNumber: string) {
  // 1. Try to find by roll number
  let student = await prisma.student.findUnique({
    where: {
      classId_rollNumber: { classId, rollNumber }
    }
  })

  if (!student) {
    // 2. Roll number not found. Maybe they are an existing student who doesn't have a roll number yet?
    const existingByName = await prisma.student.findFirst({
      where: {
        classId,
        name: { equals: name, mode: 'insensitive' },
        rollNumber: null
      }
    })

    if (existingByName) {
      // 3. Found them! Update their roll number so they are linked permanently.
      student = await prisma.student.update({
        where: { id: existingByName.id },
        data: { rollNumber, showInLeaderboard: true }
      })
    } else {
      // 4. Truly a new student. Create them.
      student = await prisma.student.create({
        data: {
          classId,
          rollNumber,
          name,
          showInLeaderboard: true // Ensure they show up!
        }
      })
    }
  } else {
    // If student was found by roll number, make sure they are visible on leaderboard
    if (!student.showInLeaderboard) {
      student = await prisma.student.update({
        where: { id: student.id },
        data: { showInLeaderboard: true }
      })
    }
  }

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
