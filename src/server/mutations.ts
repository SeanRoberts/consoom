import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
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

export const linkAccount = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { type: "letterboxd" | "goodreads"; username: string }) => data
  )
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      throw new Error("Database not available");
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const rssUrl =
      data.type === "letterboxd"
        ? `https://letterboxd.com/${data.username}/rss/`
        : `https://www.goodreads.com/review/list_rss/${data.username}?shelf=read`;

    await db
      .insert(schema.linkedAccounts)
      .values({
        userId,
        type: data.type,
        username: data.username,
        rssUrl,
      })
      .onConflictDoUpdate({
        target: [schema.linkedAccounts.userId, schema.linkedAccounts.type],
        set: {
          username: data.username,
          rssUrl,
        },
      });

    return { success: true };
  });

export const saveYearlyGoal = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { year: number; type: "movie" | "book"; target: number }) => data
  )
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      throw new Error("Database not available");
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    await db
      .insert(schema.yearlyGoals)
      .values({
        userId,
        year: data.year,
        type: data.type,
        target: data.target,
      })
      .onConflictDoUpdate({
        target: [
          schema.yearlyGoals.userId,
          schema.yearlyGoals.year,
          schema.yearlyGoals.type,
        ],
        set: {
          target: data.target,
        },
      });

    return { success: true };
  });

interface ImportItem {
  title: string;
  externalId: string;
  consumedAt: string;
  rating?: number;
}

export const importMedia = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { type: "letterboxd" | "goodreads"; items: ImportItem[] }) => data
  )
  .handler(async ({ data }) => {
    const cfEnv = env as CloudflareEnv;
    if (!cfEnv?.DB) {
      throw new Error("Database not available");
    }
    const db = createDb(cfEnv.DB);
    const userId = await getSessionUserId();

    const mediaType = data.type === "letterboxd" ? "movie" : "book";
    let imported = 0;

    for (const item of data.items) {
      const consumedAt = new Date(item.consumedAt);
      const yearConsumed = consumedAt.getFullYear();

      // Upsert media item
      await db
        .insert(schema.mediaItems)
        .values({
          type: mediaType,
          externalId: item.externalId,
          source: data.type,
          title: item.title,
        })
        .onConflictDoNothing();

      // Get the media item
      const mediaItem = await db.query.mediaItems.findFirst({
        where: (fields, { and, eq }) =>
          and(
            eq(fields.source, data.type),
            eq(fields.externalId, item.externalId)
          ),
      });

      if (!mediaItem) continue;

      // Upsert media log
      await db
        .insert(schema.mediaLog)
        .values({
          userId,
          mediaItemId: mediaItem.id,
          consumedAt,
          yearConsumed,
          rating: item.rating,
        })
        .onConflictDoNothing();

      imported++;
    }

    return { success: true, imported };
  });
