import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: 'authjs.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ['none'],
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = ['mikael@techchange.io', 'mfeltenmark@gmail.com']
      return allowedEmails.includes(user.email || '')
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }

      // Return token if not expired
      if (Date.now() < (token.expiresAt as number) * 1000 - 60000) {
        return token
      }

      // Refresh the access token
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        })
        const tokens = await response.json()
        if (!response.ok) throw tokens
        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        return { ...token, error: 'RefreshTokenError' }
      }
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken
      if (token.error) (session as any).error = token.error
      return session
    },
  },
})
