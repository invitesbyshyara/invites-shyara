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
  code?: string;
  rules: RateLimitRule[];
  when?: (req: Request) => boolean;
};

const applyHeaders = (
  res: Response,
  evaluation: { limit: number; remaining: number; resetSeconds: number; policy: string },
) => {
  res.setHeader("RateLimit-Limit", String(evaluation.limit));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, evaluation.remaining)));
  res.setHeader("RateLimit-Reset", String(Math.max(0, evaluation.resetSeconds)));
  res.setHeader("RateLimit-Policy", evaluation.policy);
};

export const createDistributedRateLimit = ({ message, code, rules, when }: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (when && !when(req)) {
        return next();
      }

      const evaluations: Array<{
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
        const evaluation = {
          limit: rule.limit,
          remaining: rule.limit - count,
          resetSeconds: Math.max(0, resetSeconds),
          policy: `${rule.limit};w=${rule.windowSeconds}`,
        };

        evaluations.push(evaluation);

        if (count > rule.limit) {
          applyHeaders(res, evaluation);
          res.setHeader("Retry-After", String(Math.max(1, evaluation.resetSeconds)));
          return sendError(
            res,
            message,
            429,
            {
              retryAfterSeconds: Math.max(1, evaluation.resetSeconds),
              rule: rule.name,
            },
            code ?? "RATE_LIMITED",
          );
        }
      }

      if (evaluations.length > 0) {
        const tightest = evaluations.reduce((current, candidate) =>
          candidate.remaining < current.remaining ? candidate : current,
        );
        applyHeaders(res, tightest);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const clientIpKey = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

export const createIpRateLimit = (name: string, options: { limit: number; windowSeconds: number; message: string; code?: string; when?: (req: Request) => boolean }) =>
  createDistributedRateLimit({
    message: options.message,
    code: options.code,
    when: options.when,
    rules: [
      {
        name,
        limit: options.limit,
        windowSeconds: options.windowSeconds,
        key: (req) => `${name}:ip:${clientIpKey(req)}`,
      },
    ],
  });

export const createIpAndIdentifierRateLimit = (
  name: string,
  options: {
    limit: number;
    windowSeconds: number;
    message: string;
    code?: string;
    getIdentifier: (req: Request) => string | undefined;
  },
) =>
  createDistributedRateLimit({
    message: options.message,
    code: options.code,
    rules: [
      {
        name: `${name}:ip`,
        limit: options.limit,
        windowSeconds: options.windowSeconds,
        key: (req) => `${name}:ip:${clientIpKey(req)}`,
      },
      {
        name: `${name}:identifier`,
        limit: options.limit,
        windowSeconds: options.windowSeconds,
        key: (req) => {
          const identifier = options.getIdentifier(req);
          return identifier ? `${name}:identifier:${identifier}` : undefined;
        },
      },
    ],
  });
