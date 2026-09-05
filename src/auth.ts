import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { compare } from "bcryptjs"
import prisma from "@/lib/prisma"

import crypto from "crypto"

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

declare module "next-auth" {
  interface User {
    role?: string
    schoolId?: string
    classIds?: string[]
    subjectAccess?: Record<string, string[]>
  }
  interface Session {
    user: {
      id: string
      role?: string
      name?: string | null
      schoolId?: string
      classIds?: string[]
      subjectAccess?: Record<string, string[]>
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        
        // Master Admin Check with timing-safe comparison
        const adminUser = process.env.ADMIN_USERNAME
        const adminPass = process.env.ADMIN_PASSWORD
        if (
          adminUser && adminPass &&
          safeCompare(credentials.username as string, adminUser) &&
          safeCompare(credentials.password as string, adminPass)
        ) {
          return { id: "admin", name: "Admin", role: "admin" }
        }

        // School Tenant Check
        const school = await prisma.school.findUnique({
          where: { username: credentials.username as string }
        })

        if (school && await compare(credentials.password as string, school.passwordHash)) {
          return { id: school.id, name: school.name, role: "school" }
        }

        // Sub-user Check (Teacher / Student)
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { 
            classes: { select: { id: true } },
            subjectAccess: { select: { classId: true, subjectId: true } }
          }
        })

        if (user && await compare(credentials.password as string, user.passwordHash)) {
          const subjectAccess: Record<string, string[]> = {}
          user.subjectAccess.forEach(access => {
            if (!subjectAccess[access.classId]) {
              subjectAccess[access.classId] = []
            }
            subjectAccess[access.classId].push(access.subjectId)
          })

          return { 
            id: user.id, 
            name: user.name, 
            role: user.role.toLowerCase(), // "teacher" or "student"
            schoolId: user.schoolId,
            classIds: user.classes.map(c => c.id),
            subjectAccess
          }
        }

        return null
      },
    }),
  ],
})
