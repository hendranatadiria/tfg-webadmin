import { PrismaClient } from "@prisma/client";

import { env } from "~/env.mjs";

type GlobalForPrisma = {
  prisma?: PrismaClient;
};

const globalForPrisma = global as unknown as GlobalForPrisma;

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;