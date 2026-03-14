import { NextFunction, Request, Response } from "express";
import { getDistributedTtl, incrementDistributedCounter } from "../lib/distributedStore";
import { sendError } from "../utils/http";

type RateLimitRule = {
  name: string;
  limit: number;
  windowSeconds: number;
  key: (req: Request) => string | undefined;
};

type RateLimitOptions = {
  message: string;
  rules: RateLimitRule[];
  when?: (req: Request) => boolean;
};

const applyHeaders = (
  res: Response,
  evaluation: { limit: number; remaining: number; resetSeconds: number; policy: string }
) => {
  res.setHeader("RateLimit-Limit", String(evaluation.limit));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, evaluation.remaining)));
  res.setHeader("RateLimit-Reset", String(Math.max(0, evaluation.resetSeconds)));
  res.setHeader("RateLimit-Policy", evaluation.policy);
};

const createDistributedRateLimit = ({ message, rules, when }: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (when && !when(req)) {
        return next();
      }

      const evaluations: Array<{
        name: string;
        limit: number;
        remaining: number;
        resetSeconds: number;
        policy: string;
      }> = [];

      for (const rule of rules) {
        const key = rule.key(req);
        if (!key) {
          continue;
        }

        const count = await incrementDistributedCounter(key, rule.windowSeconds);
        const resetSeconds = await getDistributedTtl(key);
        const remaining = rule.limit - count;
        const evaluation = {
          name: rule.name,
          limit: rule.limit,
          remaining,
          resetSeconds: Math.max(0, resetSeconds),
          policy: `${rule.limit};w=${rule.windowSeconds}`,
        };
        evaluations.push(evaluation);

        if (count > rule.limit) {
          applyHeaders(res, evaluation);
          res.setHeader("Retry-After", String(Math.max(1, evaluation.resetSeconds)));
          return sendError(res, message, 429, {
            rule: rule.name,
            retryAfterSeconds: Math.max(1, evaluation.resetSeconds),
          });
        }
      }

      if (evaluations.length > 0) {
        const tightest = evaluations.reduce((current, candidate) =>
          candidate.remaining < current.remaining ? candidate : current
        );
        applyHeaders(res, tightest);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const getUserId = (req: Request) => req.user?.id;
const getInviteId = (req: Request) => req.params.inviteId ?? req.params.id;

export const createAiWriteRateLimit = (routeName: string, options?: { when?: (req: Request) => boolean }) =>
  createDistributedRateLimit({
    message: "Too many translation-triggering changes. Please wait before trying again.",
    when: options?.when,
    rules: [
      {
        name: `${routeName}:user:10m`,
        limit: 20,
        windowSeconds: 10 * 60,
        key: (req) => {
          const userId = getUserId(req);
          return userId ? `ai-rate:${routeName}:user:${userId}:10m` : undefined;
        },
      },
      {
        name: `${routeName}:invite:5m`,
        limit: 6,
        windowSeconds: 5 * 60,
        key: (req) => {
          const inviteId = getInviteId(req);
          return inviteId ? `ai-rate:${routeName}:invite:${inviteId}:5m` : undefined;
        },
      },
      {
        name: `${routeName}:user:1d`,
        limit: 100,
        windowSeconds: 24 * 60 * 60,
        key: (req) => {
          const userId = getUserId(req);
          return userId ? `ai-rate:${routeName}:user:${userId}:1d` : undefined;
        },
      },
    ],
  });

export const createAiLocalizationRateLimit = (routeName: string) =>
  createDistributedRateLimit({
    message: "Too many localization refresh requests. Please wait before trying again.",
    rules: [
      {
        name: `${routeName}:user:10m`,
        limit: 5,
        windowSeconds: 10 * 60,
        key: (req) => {
          const userId = getUserId(req);
          return userId ? `ai-rate:${routeName}:user:${userId}:10m` : undefined;
        },
      },
      {
        name: `${routeName}:invite:5m`,
        limit: 3,
        windowSeconds: 5 * 60,
        key: (req) => {
          const inviteId = getInviteId(req);
          return inviteId ? `ai-rate:${routeName}:invite:${inviteId}:5m` : undefined;
        },
      },
      {
        name: `${routeName}:user:1d`,
        limit: 100,
        windowSeconds: 24 * 60 * 60,
        key: (req) => {
          const userId = getUserId(req);
          return userId ? `ai-rate:${routeName}:user:${userId}:1d` : undefined;
        },
      },
    ],
  });
