import { PrismaClient } from "@prisma/client";
import { seedAdminUsers, seedCore, seedTestUser } from "./seed-lib";

const prisma = new PrismaClient();

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required when using production-safe seeding.`);
  }
  return value;
};

async function main() {
  await seedCore(prisma);

  if (process.env.SEED_TEST_USER === "true") {
    await seedTestUser(prisma, requireEnv("TEST_USER_PASSWORD"));
  }

  if (process.env.SEED_ADMIN_USERS === "true") {
    await seedAdminUsers(prisma, {
      admin: requireEnv("ADMIN_SEED_PASSWORD"),
      support: requireEnv("SUPPORT_SEED_PASSWORD"),
    });
  }

  console.log("Production-safe seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
