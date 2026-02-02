import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { compare } from "bcryptjs"

/**
 * Configuración central de NextAuth.js (Auth.js) para FinanzasCL.
 * - Proveedores: Google OAuth y Credentials (email/contraseña).
 * - Persistencia: Supabase/PostgreSQL vía PrismaAdapter (User, Account, Session para Google).
 * - Credentials usa sesión JWT (no crea Account); usuarios con contraseña se validan contra User.password.
 * Documentación: docs/NEXTAUTH-SETUP.md
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Correo y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = String(credentials.email).trim().toLowerCase()
        const password = String(credentials.password)

        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user || !user.password) return null

        const isValid = await compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub)
      }
      return session
    },
  },
  trustHost: true,
})
