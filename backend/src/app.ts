import "./types";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { env } from "./lib/env";
import {
  API_PREFIXES,
  joinApiPath,
} from "./lib/apiPaths";
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
import adminSecurityEventsRoutes from "./routes/admin/security-events";
import { requireAdminCsrf, requireCustomerCsrf } from "./middleware/csrf";
import { errorHandler } from "./middleware/errorHandler";
import { assignRequestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { createIpAndIdentifierRateLimit, createIpRateLimit } from "./middleware/rateLimit";
import { AppError } from "./utils/http";

const WEBHOOK_ROUTE = "/checkout/webhook";

const buildApiRouter = (options: {
  authLimiter: express.RequestHandler;
  otpLimiter: express.RequestHandler;
  rsvpLimiter: express.RequestHandler;
  adminAuthLimiter: express.RequestHandler;
  publicInviteLimiter: express.RequestHandler;
  uploadLimiter: express.RequestHandler;
}) => {
  const router = express.Router();
  const { authLimiter, otpLimiter, rsvpLimiter, adminAuthLimiter, publicInviteLimiter, uploadLimiter } = options;

  router.use("/auth/login", authLimiter);
  router.use("/auth/register", authLimiter);
  router.use("/auth/forgot-password", otpLimiter);
  router.use("/auth/reset-password", otpLimiter);
  router.use("/admin/auth/login", adminAuthLimiter);
  router.use("/public/invites/:slug", publicInviteLimiter);
  router.use("/public/invites/:slug/rsvp", rsvpLimiter);
  router.use("/invites/upload-image", uploadLimiter);

  router.use("/auth", authRoutes);
  router.use("/templates", templateRoutes);
  router.use("/invites", requireCustomerCsrf, inviteRoutes);
  router.use("/invite-ops", requireCustomerCsrf, inviteOpsRoutes);
  router.use("/public", publicRoutes);
  router.use("/checkout", checkoutRoutes);

  router.use("/admin/auth", adminAuthRoutes);
  router.use("/admin/dashboard", requireAdminCsrf, adminDashboardRoutes);
  router.use("/admin/customers", requireAdminCsrf, adminCustomerRoutes);
  router.use("/admin/invites", requireAdminCsrf, adminInviteRoutes);
  router.use("/admin/templates", requireAdminCsrf, adminTemplateRoutes);
  router.use("/admin/transactions", requireAdminCsrf, adminTransactionRoutes);
  router.use("/admin/categories", requireAdminCsrf, adminCategoryRoutes);
  router.use("/admin/promo-codes", requireAdminCsrf, adminPromoCodeRoutes);
  router.use("/admin/announcements", requireAdminCsrf, adminAnnouncementRoutes);
  router.use("/admin/notes", requireAdminCsrf, adminNotesRoutes);
  router.use("/admin/settings", requireAdminCsrf, adminSettingsRoutes);
  router.use("/admin/search", requireAdminCsrf, adminSearchRoutes);
  router.use("/admin/admins", requireAdminCsrf, adminAdminsRoutes);
  router.use("/admin/audit-logs", requireAdminCsrf, adminAuditLogsRoutes);
  router.use("/admin/security-events", requireAdminCsrf, adminSecurityEventsRoutes);

  return router;
};

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);
  const allowedOrigins = [env.FRONTEND_URL, env.ADMIN_PORTAL_URL ?? env.FRONTEND_URL];
  const webhookPaths = API_PREFIXES.map((prefix) => joinApiPath(prefix, WEBHOOK_ROUTE));

  const authLimiter = createIpAndIdentifierRateLimit("auth-login", {
    limit: 10,
    windowSeconds: 15 * 60,
    message: "Too many attempts, please try again later.",
    getIdentifier: (req) =>
      typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : undefined,
  });

  const adminAuthLimiter = createIpAndIdentifierRateLimit("admin-auth-login", {
    limit: 8,
    windowSeconds: 15 * 60,
    message: "Too many admin login attempts, please try again later.",
    getIdentifier: (req) =>
      typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : undefined,
  });

  const otpLimiter = createIpAndIdentifierRateLimit("password-reset", {
    limit: 5,
    windowSeconds: 60 * 60,
    message: "Too many password reset attempts.",
    getIdentifier: (req) =>
      typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : undefined,
  });

  const rsvpLimiter = createIpRateLimit("public-rsvp", {
    limit: 5,
    windowSeconds: 60 * 60,
    message: "Too many RSVP submissions.",
  });

  const publicInviteLimiter = createIpRateLimit("public-invite-view", {
    limit: 120,
    windowSeconds: 60 * 60,
    message: "Too many invite views. Please try again later.",
  });

  const uploadLimiter = createIpRateLimit("upload-image", {
    limit: 30,
    windowSeconds: 15 * 60,
    message: "Too many uploads. Please try again later.",
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        reportOnly: env.NODE_ENV !== "production",
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          connectSrc: ["'self'", env.FRONTEND_URL, env.API_PUBLIC_URL ?? env.FRONTEND_URL, "https://accounts.google.com", "https://www.googleapis.com", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://res.cloudinary.com"],
          scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com", "https://checkout.razorpay.com"],
          objectSrc: ["'none'"],
          formAction: ["'self'"],
        },
      },
      frameguard: { action: "deny" },
      hsts: env.NODE_ENV === "production" ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
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

        callback(new AppError("CORS blocked", 403, { code: "CORS_BLOCKED" }));
      },
      credentials: true,
    }),
  );

  app.use(cookieParser());
  app.use(assignRequestId);
  app.use(requestLogger);
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buffer) => {
        (req as express.Request).rawBody = buffer;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(hpp());
  app.use(
    createIpRateLimit("global-api", {
      limit: 300,
      windowSeconds: 15 * 60,
      message: "Too many requests",
      when: (req) => !webhookPaths.some((path) => req.originalUrl.startsWith(path)),
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  const apiRouter = buildApiRouter({
    authLimiter,
    otpLimiter,
    rsvpLimiter,
    adminAuthLimiter,
    publicInviteLimiter,
    uploadLimiter,
  });

  for (const prefix of API_PREFIXES) {
    app.use(prefix, apiRouter);
  }

  app.use(
    "/share",
    (_req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    },
    shareRoutes,
  );

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  app.use(errorHandler);

  return app;
};
