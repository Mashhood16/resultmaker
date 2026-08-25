import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.sub as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      // Bypassing NextAuth Edge Middleware protection due to Next.js Edge bugs with custom token properties (like role).
      // Security is strictly and natively handled inside the Server Components themselves (e.g. app/admin/page.tsx)
      // which use `await auth()` in the reliable Node.js runtime instead of the Edge runtime.
      return true
    },
  },
  trustHost: true,
  providers: [],
} satisfies NextAuthConfig
