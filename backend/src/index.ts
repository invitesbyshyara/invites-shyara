import "./types";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import templateRoutes from "./routes/templates";
import inviteRoutes from "./routes/invites";
import inviteOpsRoutes from "./routes/invite-ops";
import publicRoutes from "./routes/public";
import checkoutRoutes from "./routes/checkout";
import shareRoutes from "./routes/share";
import adminAuthRoutes from "./routes/admin/auth";
import adminDashboardRoutes from "./routes/admin/dashboard";
import adminCustomerRoutes from "./routes/admin/customers";
import adminInviteRoutes from "./routes/admin/invites";
import adminTemplateRoutes from "./routes/admin/templates";
import adminTransactionRoutes from "./routes/admin/transactions";
import adminCategoryRoutes from "./routes/admin/categories";
import adminPromoCodeRoutes from "./routes/admin/promo-codes";
import adminAnnouncementRoutes from "./routes/admin/announcements";
import adminNotesRoutes from "./routes/admin/notes";
import adminSettingsRoutes from "./routes/admin/settings";
import adminSearchRoutes from "./routes/admin/search";
import adminAdminsRoutes from "./routes/admin/admins";
import adminAuditLogsRoutes from "./routes/admin/audit-logs";
import { errorHandler } from "./middleware/errorHandler";
import { startRsvpReminderJob } from "./jobs/rsvpReminders";

const app = express();
const allowedOrigins = [env.FRONTEND_URL, env.ADMIN_PORTAL_URL ?? env.FRONTEND_URL];
const webhookPath = "/api/checkout/webhook";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts, please try again later." },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many password reset attempts." },
});

const rsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}_${req.params.slug}`,
  message: { success: false, error: "Too many RSVP submissions." },
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: "Too many requests",
      });
    },
    skip: (req) => req.originalUrl.startsWith(webhookPath),
  }),
);

app.use(cookieParser());
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buffer) => {
      (req as express.Request).rawBody = buffer;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/public/invites/:slug/rsvp", rsvpLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/invite-ops", inviteOpsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/checkout", checkoutRoutes);

// Public share pages — no CORS restriction, returns HTML for OG crawler previews
app.use("/share", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, shareRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/invites", adminInviteRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/admin/transactions", adminTransactionRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/promo-codes", adminPromoCodeRoutes);
app.use("/api/admin/announcements", adminAnnouncementRoutes);
app.use("/api/admin/notes", adminNotesRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/search", adminSearchRoutes);
app.use("/api/admin/admins", adminAdminsRoutes);
app.use("/api/admin/audit-logs", adminAuditLogsRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`Backend running on port ${env.PORT}`);
  startRsvpReminderJob();
});

let isShuttingDown = false;

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
