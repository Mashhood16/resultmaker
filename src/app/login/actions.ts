'use server'

import { signIn, auth } from "@/auth"
import { AuthError } from "next-auth"
import { cookies } from "next/headers"
import crypto from "crypto"

// In-memory rate limiting map for login attempts
const loginThrottleMap = new Map<string, { attempts: number; lockUntil: number }>()

function checkLoginRateLimit(key: string): { allowed: boolean; remainingMinutes?: number } {
  const now = Date.now()
  const record = loginThrottleMap.get(key)
  if (!record) return { allowed: true }

  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000)
    return { allowed: false, remainingMinutes: Math.ceil(remainingSeconds / 60) }
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginThrottleMap.delete(key)
  }

  return { allowed: true }
}

function recordFailedLogin(key: string) {
  const now = Date.now()
  const record = loginThrottleMap.get(key) || { attempts: 0, lockUntil: 0 }
  record.attempts += 1
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000 // 15 minute lockout
    record.attempts = 0
  }
  loginThrottleMap.set(key, record)
}

function clearLoginAttempts(key: string) {
  loginThrottleMap.delete(key)
}

export async function authenticate(formData: FormData) {
  const username = String(formData.get('username') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!username || !password) {
    return 'Username and password are required.'
  }

  const cookieStore = cookies()
  let deviceToken = cookieStore.get('cendro_login_token')?.value
  if (!deviceToken) {
    deviceToken = crypto.randomUUID()
    cookieStore.set('cendro_login_token', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    })
  }

  const throttleKey = `${deviceToken}_${username}`
  const rateLimitStatus = checkLoginRateLimit(throttleKey)
  if (!rateLimitStatus.allowed) {
    return `Too many failed login attempts. Please wait ${rateLimitStatus.remainingMinutes || 15} minute(s) before trying again.`
  }

  try {
    const credentials = Object.fromEntries(formData)
    await signIn('credentials', {
      ...credentials,
      redirect: false
    })
    
    // Clear failed attempts upon successful login
    clearLoginAttempts(throttleKey)

    const session = await auth()
    if (session?.user?.role === 'admin') {
      return { redirectUrl: '/admin' }
    } else {
      return { redirectUrl: '/dashboard' }
    }
  } catch (error) {
    recordFailedLogin(throttleKey)
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid username or password.'
        default:
          return `Auth Error: ${error.message}`
      }
    }
    console.error('Login action error:', error)
    return 'An unexpected error occurred during login. Please check Vercel logs.'
  }
}
