import { EventCategory } from "@prisma/client";

export const normalizeCategory = (value: string): EventCategory => {
  const normalized = value.replace(/-/g, "_") as EventCategory;
  return normalized;
};
