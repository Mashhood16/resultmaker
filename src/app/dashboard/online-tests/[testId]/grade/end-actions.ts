'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { requireSchoolOrTeacherAccess } from '../../../auth-utils'
import { revalidatePath } from 'next/cache'

export async function endTestManually(testId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const access = await requireSchoolOrTeacherAccess()
  if (!access) throw new Error('Forbidden')

  // Verify test ownership/access
  const test = await prisma.onlineTest.findUnique({
    where: { id: testId }
  })
  
  if (!test) throw new Error('Test not found')
  if (test.schoolId !== access.schoolId) {
    throw new Error('Forbidden: Access denied to this school test')
  }
  if (access.isTeacher && !access.classIds.includes(test.classId)) {
    throw new Error('Forbidden: You are not assigned to this class')
  }

  // 1. Deactivate test
  await prisma.onlineTest.update({
    where: { id: testId },
    data: { isActive: false }
  })

  // 2. Force all IN_PROGRESS attempts to SUBMITTED
  await prisma.testAttempt.updateMany({
    where: {
      testId: testId,
      status: 'IN_PROGRESS'
    },
    data: {
      status: 'SUBMITTED'
    }
  })

  revalidatePath(`/dashboard/online-tests/${testId}/grade`)
  revalidatePath(`/dashboard/online-tests`)
}
