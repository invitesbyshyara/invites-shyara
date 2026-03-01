import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  validate({ query: z.object({ q: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const { q } = req.query as { q: string };

    const [customers, invites, transactions] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        take: 10,
      }),
      prisma.invite.findMany({
        where: {
          slug: { contains: q, mode: "insensitive" },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: {
          OR: [
            { stripeChargeId: { contains: q, mode: "insensitive" } },
            { stripePaymentIntentId: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    return sendSuccess(res, {
      customers,
      invites,
      transactions,
    });
  }),
);

export default router;
