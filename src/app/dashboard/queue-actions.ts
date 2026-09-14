'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function deleteQueueItem(id: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prisma.whatsAppQueue.delete({
      where: { id }
    })
    revalidatePath('/dashboard/uploads')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function clearQueue(status?: 'PENDING' | 'SENT' | 'FAILED') {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    if (status) {
      await prisma.whatsAppQueue.deleteMany({
        where: { status }
      })
    } else {
      await prisma.whatsAppQueue.deleteMany({})
    }
    revalidatePath('/dashboard/uploads')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateQueueMessage(id: string, message: string) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prisma.whatsAppQueue.update({
      where: { id },
      data: { message }
    })
    revalidatePath('/dashboard/uploads')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

