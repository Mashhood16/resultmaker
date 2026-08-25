import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { compare } from "bcryptjs"
import prisma from "@/lib/prisma"

declare module "next-auth" {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      role?: string
      name?: string | null
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

        return null
      },
    }),
  ],
})
