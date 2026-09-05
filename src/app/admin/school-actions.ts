'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'

import { auth } from '@/auth'

export async function addSchool(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    return { error: 'Forbidden: Admin access required.' }
  }

  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!name || !username || !password) {
    return { error: 'All fields are required.' }
  }

  try {
    const passwordHash = await hash(password, 10)
    await prisma.school.create({
      data: {
        name,
        username,
        passwordHash
      }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Username already exists.' }
    }
    return { error: 'Failed to create school.' }
  }
}

export async function getSchools() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required.')
  }

  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return schools
}
