import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { createAuth } from "../lib/auth";

async function getSessionUserId() {
  const request = getRequest();
  const cfEnv = env as CloudflareEnv & {
    BETTER_AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  const auth = createAuth(cfEnv);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export const getLinkedAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      return [];
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const accounts = await db.query.linkedAccounts.findMany({
      where: eq(schema.linkedAccounts.userId, userId),
    });

    return accounts;
  }
);

export const getYearlyGoals = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number }) => data)
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      return [];
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const goals = await db.query.yearlyGoals.findMany({
      where: and(
        eq(schema.yearlyGoals.userId, userId),
        eq(schema.yearlyGoals.year, data.year)
      ),
    });

    return goals;
  });

export const getMediaForYear = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; type?: "movie" | "book" }) => data)
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      return [];
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const logs = await db.query.mediaLog.findMany({
      where: and(
        eq(schema.mediaLog.userId, userId),
        eq(schema.mediaLog.yearConsumed, data.year)
      ),
      with: {
        mediaItem: true,
      },
      orderBy: desc(schema.mediaLog.consumedAt),
    });

    if (data.type) {
      return logs.filter((log) => log.mediaItem.type === data.type);
    }

    return logs;
  });

export const getRecentMedia = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      return [];
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const logs = await db.query.mediaLog.findMany({
      where: eq(schema.mediaLog.userId, userId),
      with: {
        mediaItem: true,
      },
      orderBy: desc(schema.mediaLog.consumedAt),
      limit: data.limit || 10,
    });

    return logs;
  });

