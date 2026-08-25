'use server'

import { signIn, auth } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(formData: FormData) {
  try {
    const credentials = Object.fromEntries(formData)
    await signIn('credentials', {
      ...credentials,
      redirect: false
    })
    
    // If we get here, sign in was successful
    const session = await auth()
    if (session?.user?.role === 'admin') {
      return { redirectUrl: '/admin' }
    } else {
      return { redirectUrl: '/dashboard' } // force to dashboard instead of / to ensure state changes
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid username or password.'
        default:
          return `Auth Error: ${error.message}`
      }
    }
    // Handle unexpected errors by returning them as strings
    console.error('Login action error:', error)
    return 'An unexpected error occurred during login. Please check Vercel logs.'
  }
}
