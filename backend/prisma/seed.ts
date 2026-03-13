import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_SUPPORT_PASSWORD,
  DEFAULT_TEST_USER_PASSWORD,
  seedAdminUsers,
  seedCore,
  seedTestUser,
} from "./seed-lib";

const prisma = new PrismaClient();

async function main() {
  await seedAdminUsers(prisma, {
    admin: process.env.ADMIN_SEED_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    support: process.env.SUPPORT_SEED_PASSWORD || DEFAULT_SUPPORT_PASSWORD,
  });
  await seedTestUser(prisma, process.env.TEST_USER_PASSWORD || DEFAULT_TEST_USER_PASSWORD);
  await seedCore(prisma);

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
