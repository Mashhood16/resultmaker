'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// In-memory rate limiter for PIN brute-force protection
const pinThrottleMap = new Map<string, { attempts: number; lockUntil: number }>()

function checkPinRateLimit(deviceKey: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now()
  const record = pinThrottleMap.get(deviceKey)
  if (!record) return { allowed: true }

  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000)
    return { allowed: false, waitMinutes: Math.ceil(remainingSeconds / 60) }
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    pinThrottleMap.delete(deviceKey)
  }

  return { allowed: true }
}

function recordFailedPinAttempt(deviceKey: string) {
  const now = Date.now()
  const record = pinThrottleMap.get(deviceKey) || { attempts: 0, lockUntil: 0 }
  record.attempts += 1
  if (record.attempts >= 5) {
    record.lockUntil = now + 5 * 60 * 1000 // 5 minute cooldown
    record.attempts = 0
  }
  pinThrottleMap.set(deviceKey, record)
}

function clearPinAttempts(deviceKey: string) {
  pinThrottleMap.delete(deviceKey)
}

export async function claimTestAccess(classId: string, testId: string, name: string, rollNumber: string, pin: string) {
  const trimmedPin = pin?.trim()
  const trimmedName = name?.trim()
  const trimmedRoll = rollNumber?.trim()

  if (!trimmedPin) {
    return { error: 'Access PIN is required.' }
  }
  if (!trimmedName || trimmedName.length > 100) {
    return { error: 'Please enter a valid student name (maximum 100 characters).' }
  }
  if (!trimmedRoll || trimmedRoll.length > 50) {
    return { error: 'Please enter a valid roll number (maximum 50 characters).' }
  }

  const cookieStore = cookies()
  let deviceToken = cookieStore.get('cendro_device_token')?.value
  if (!deviceToken) {
    deviceToken = crypto.randomUUID()
    cookieStore.set('cendro_device_token', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    })
  }
  const throttleKey = `${deviceToken}_${testId}`

  // Check rate limit
  const rateLimitStatus = checkPinRateLimit(throttleKey)
  if (!rateLimitStatus.allowed) {
    return { error: `Too many failed attempts. Please wait ${rateLimitStatus.waitMinutes || 5} minute(s) before trying again.` }
  }

  // Verify test exists, is active, and strictly belongs to this class
  const test = await prisma.onlineTest.findUnique({
    where: { id: testId },
    select: { id: true, classId: true, isActive: true }
  })

  if (!test || !test.isActive || test.classId !== classId) {
    return { error: 'Test not found or is no longer active for this class.' }
  }

  // Verify PIN securely on the server
  const variant = await prisma.testVariant.findFirst({
    where: {
      testId,
      accessPin: trimmedPin
    }
  })

  if (!variant) {
    recordFailedPinAttempt(throttleKey)
    return { error: 'Invalid PIN. Please ask your teacher for the correct PIN.' }
  }

  clearPinAttempts(throttleKey)

  // 1. Try to find by roll number
  let student = await prisma.student.findUnique({
    where: {
      classId_rollNumber: { classId, rollNumber: trimmedRoll }
    }
  })

  if (!student) {
    // 2. Roll number not found. Maybe they are an existing student who doesn't have a roll number yet?
    const existingByName = await prisma.student.findFirst({
      where: {
        classId,
        name: { equals: trimmedName, mode: 'insensitive' },
        rollNumber: null
      }
    })

    if (existingByName) {
      // 3. Found them! Update their roll number so they are linked permanently.
      student = await prisma.student.update({
        where: { id: existingByName.id },
        data: { rollNumber: trimmedRoll, showInLeaderboard: true }
      })
    } else {
      // 4. Truly a new student. Create them.
      student = await prisma.student.create({
        data: {
          classId,
          rollNumber: trimmedRoll,
          name: trimmedName,
          showInLeaderboard: true
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

  return { success: true, variantId: variant.id }
}
