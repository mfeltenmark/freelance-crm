import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      // Optional: Restrict to specific emails
      // const allowedEmails = ['micky@techchange.io']
      // if (!allowedEmails.includes(user.email || '')) {
      //   return false
      // }
      return true
    },
  },
})
