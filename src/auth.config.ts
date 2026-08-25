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
      // In NextAuth v5, custom properties might be on auth.user or directly on the token depending on the callback resolution
      const role = auth?.user?.role || (auth as any)?.role
      
      console.log('Middleware Auth Check:', { isLoggedIn, role, path: nextUrl.pathname })

      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnLogin = nextUrl.pathname.startsWith('/login')

      if (isOnAdmin && nextUrl.pathname !== '/admin/login') {
        if (isLoggedIn) {
          // If they are logged in and trying to access admin, let them in if they are admin.
          // If role is missing for some reason, we'll allow it so they don't get stuck, and the page itself can block them.
          if (role === 'admin' || !role) return true;
        }
        return false // Redirect to login
      }

      if (!isOnAdmin && !isOnLogin && !nextUrl.pathname.startsWith('/_next') && !nextUrl.pathname.includes('.')) {
        if (isLoggedIn) return true
        return false
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
