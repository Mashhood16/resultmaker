'use server'

import { signIn, auth } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(formData: FormData) {
  try {
    const credentials = Object.fromEntries(formData)
    const result = await signIn('credentials', {
      ...credentials,
      redirect: false
    })
    
    if (result?.error) {
      return 'Invalid credentials.'
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }
    // If it's a redirect error, re-throw it so Next.js handles it
    throw error
  }
  
  // If we get here, sign in was successful
  const session = await auth()
  if (session?.user?.role === 'admin') {
    return { redirectUrl: '/admin' }
  } else {
    return { redirectUrl: '/' }
  }
}
