import bcrypt from "bcrypt";
import { AdminRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const ADMIN_EMAIL = "admin@shyara.co.in";
const SUPPORT_EMAIL = "support@shyara.co.in";

export async function bootstrapAdminUsersFromEnv() {
  if (process.env.SEED_ADMIN_USERS !== "true") {
    return;
  }

  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const supportPassword = process.env.SUPPORT_SEED_PASSWORD;

  if (!adminPassword || !supportPassword) {
    logger.warn("Skipping admin bootstrap because admin seed passwords are missing");
    return;
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const supportPasswordHash = await bcrypt.hash(supportPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      name: "Admin User",
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: AdminRole.admin,
    },
    update: {
      passwordHash: adminPasswordHash,
      role: AdminRole.admin,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: SUPPORT_EMAIL },
    create: {
      name: "Support User",
      email: SUPPORT_EMAIL,
      passwordHash: supportPasswordHash,
      role: AdminRole.support,
    },
    update: {
      passwordHash: supportPasswordHash,
      role: AdminRole.support,
    },
  });

  logger.info("Admin users bootstrapped from environment");
}
