'use server'

import prisma from '@/lib/prisma'

export async function autosaveAttempt(attemptId: string, answers: string) {
  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { answers }
  })
}

export async function submitAttempt(attemptId: string, answers: string) {
  await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { 
      answers,
      status: 'SUBMITTED' 
    }
  })
}
