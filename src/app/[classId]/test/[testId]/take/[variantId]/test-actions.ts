'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function verifyAttemptAccess(attemptId: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId }
  })

  if (!attempt) {
    throw new Error('Attempt not found')
  }

  if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
    throw new Error('Test has already been submitted and cannot be modified.')
  }

  const cookieStore = cookies()
  const deviceSessionKey = `test_device_lock_${attempt.testId}`
  const deviceStudentId = cookieStore.get(deviceSessionKey)?.value

  if (!deviceStudentId || deviceStudentId !== attempt.studentId) {
    throw new Error('Forbidden: Invalid or missing device session for this test attempt.')
  }

  return attempt
}

export async function autosaveAttempt(attemptId: string, answers: string) {
  await verifyAttemptAccess(attemptId)

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { answers }
  })
}

export async function submitAttempt(attemptId: string, answers: string) {
  await verifyAttemptAccess(attemptId)

  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { 
      answers,
      status: 'SUBMITTED' 
    }
  })
}
