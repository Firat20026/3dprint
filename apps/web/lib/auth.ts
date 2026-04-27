import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const providers = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Şifre", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (!user || !user.passwordHash) return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }) as never
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // First-time issuance (after authorize()): copy id+role into the token.
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        return token;
      }
      // Optional manual refresh: when the client calls update() (e.g. after
      // promoting a user from /admin), re-read the role from DB. Otherwise
      // we trust the role baked into the JWT — no per-request DB hit.
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Lazy import to avoid bundling observability into edge auth.config.
      const { track, EVENTS } = await import("@/lib/observability");
      void track(
        isNewUser ? EVENTS.USER_SIGNUP : EVENTS.USER_LOGIN,
        {
          provider: account?.provider ?? "credentials",
          isNewUser: Boolean(isNewUser),
        },
        { userId: user.id ?? null },
      );
    },
    async signOut(message) {
      const { track, EVENTS } = await import("@/lib/observability");
      // NextAuth v5: message can be { token } (jwt) or { session } (db). We
      // only need the userId when present.
      const userId =
        ("token" in message && message.token && "id" in message.token
          ? (message.token.id as string | undefined)
          : undefined) ??
        ("session" in message && message.session && "userId" in message.session
          ? (message.session.userId as string | undefined)
          : undefined) ??
        null;
      void track(EVENTS.USER_LOGOUT, {}, { userId });
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}
