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

  const rawName = formData.get('name')
  const rawUsername = formData.get('username')
  const rawPassword = formData.get('password')

  if (typeof rawName !== 'string' || typeof rawUsername !== 'string' || typeof rawPassword !== 'string') {
    return { error: 'All fields are required and must be valid text.' }
  }

  const cleanName = rawName.trim()
  const cleanUsername = rawUsername.trim().toLowerCase()
  const password = rawPassword

  if (cleanName.length < 2 || cleanName.length > 100) {
    return { error: 'School name must be between 2 and 100 characters.' }
  }

  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(cleanUsername)) {
    return { error: 'Username must be 3-50 alphanumeric characters (letters, numbers, underscores, hyphens).' }
  }

  if (password.length < 6 || password.length > 100) {
    return { error: 'Password must be between 6 and 100 characters.' }
  }

  try {
    const passwordHash = await hash(password, 10)
    await prisma.school.create({
      data: {
        name: cleanName,
        username: cleanUsername,
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
