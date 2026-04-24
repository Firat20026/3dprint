/**
 * Edge-safe NextAuth export used by middleware.ts. Pulls only authConfig.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth } = NextAuth(authConfig);
