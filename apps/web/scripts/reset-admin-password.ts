/**
 * Reset admin password.
 *
 * Usage (locally):    pnpm --filter @frint3d/web exec tsx scripts/reset-admin-password.ts <email> <newPassword>
 * Usage (in docker):  docker compose exec web pnpm exec tsx scripts/reset-admin-password.ts <email> <newPassword>
 *
 * If <newPassword> omitted, generates a strong random one and prints it.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  const email = emailArg ?? process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (!email) {
    console.error("usage: reset-admin-password.ts <email> [newPassword]");
    process.exit(1);
  }

  const newPassword =
    passwordArg ?? randomBytes(16).toString("base64url");

  const hash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { passwordHash: hash, role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log("password reset:", { user, newPassword });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
