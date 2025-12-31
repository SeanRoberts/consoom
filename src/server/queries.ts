import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";

export const getLinkedAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      return [];
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const accounts = await db.query.linkedAccounts.findMany({
      where: eq(schema.linkedAccounts.userId, userId),
    });

    return accounts;
  }
);

export const getYearlyGoals = createServerFn({ method: "GET" })
  .validator((data: { year: number }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      return [];
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const goals = await db.query.yearlyGoals.findMany({
      where: and(
        eq(schema.yearlyGoals.userId, userId),
        eq(schema.yearlyGoals.year, data.year)
      ),
    });

    return goals;
  });

export const getMediaForYear = createServerFn({ method: "GET" })
  .validator((data: { year: number; type?: "movie" | "book" }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      return [];
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

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
  .validator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      return [];
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

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
