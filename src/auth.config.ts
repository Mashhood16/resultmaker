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
      const isLoggedIn = !!auth?.user
      const role = auth?.user?.role
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnLogin = nextUrl.pathname.startsWith('/login')

      if (isOnAdmin && nextUrl.pathname !== '/admin/login') {
        if (isLoggedIn && role === 'admin') return true
        return false
      }

      if (!isOnAdmin && !isOnLogin && !nextUrl.pathname.startsWith('/_next') && !nextUrl.pathname.includes('.')) {
        if (isLoggedIn && role === 'school') return true
        if (isLoggedIn && role === 'admin') return true // admin can see everything
        return false
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
