import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { createApp } from "./app";
import { startRsvpReminderJob } from "./jobs/rsvpReminders";
import { bootstrapAdminUsersFromEnv } from "./services/adminBootstrap";

let isShuttingDown = false;

const start = async () => {
  await bootstrapAdminUsersFromEnv();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Backend running on port ${env.PORT}`);
    startRsvpReminderJob();
  });

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      logger.info("HTTP server closed");
      await prisma.$disconnect();
      logger.info("Database connection closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30_000);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { err });
    void shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
    void shutdown("unhandledRejection");
  });
};

void start();
