import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { compare } from "bcryptjs"
import prisma from "@/lib/prisma"

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
        
        // Master Admin Check
        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
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
