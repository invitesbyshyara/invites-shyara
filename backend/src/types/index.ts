import { AdminUser, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      admin?: AdminUser;
      rawBody?: Buffer;
    }
  }
}

export type PublicInviteResponse = {
  templateSlug: string;
  templateCategory: string;
  data: Record<string, unknown>;
  inviteId: string;
  status: string;
};

export {};
