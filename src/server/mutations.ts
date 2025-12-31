import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";
import { createDb, schema } from "../db";

export const linkAccount = createServerFn({ method: "POST" })
  .validator(
    (data: { type: "letterboxd" | "goodreads"; username: string }) => data
  )
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      throw new Error("Database not available");
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

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
  .validator(
    (data: { year: number; type: "movie" | "book"; target: number }) => data
  )
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf?.env;
    if (!env?.DB) {
      throw new Error("Database not available");
    }
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

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
