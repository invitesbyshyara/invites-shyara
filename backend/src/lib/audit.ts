import { prisma } from "./prisma";

export async function logAudit(params: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: object;
}) {
  await prisma.auditLog.create({ data: params });
}
