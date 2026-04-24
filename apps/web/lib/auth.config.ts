/**
 * Edge-safe auth config — Credentials provider shell + session/jwt callbacks.
 * No DB, no bcrypt, no PrismaAdapter — those live in `lib/auth.ts`. This file
 * is the one middleware imports so it can run on the edge runtime.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // real providers added in lib/auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
};
