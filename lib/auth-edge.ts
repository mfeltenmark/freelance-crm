import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// Lightweight config for Edge middleware - no Prisma adapter
export const { auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
})
