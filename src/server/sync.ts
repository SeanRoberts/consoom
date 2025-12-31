import { createDb, schema } from "../db";
import { eq, and } from "drizzle-orm";

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  const response = await fetch(url);
  const text = await response.text();

  const items: RSSItem[] = [];
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemXml = match[1];
    const title =
      itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      itemXml.match(/<title>(.*?)<\/title>/)?.[1] ||
      "";
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    if (title && link) {
      items.push({ title, link, pubDate });
    }
  }

  return items;
}

function extractLetterboxdId(link: string): string {
  // https://letterboxd.com/user/film/movie-slug/ -> movie-slug
  const match = link.match(/\/film\/([^/]+)/);
  return match?.[1] || link;
}

function extractGoodreadsId(link: string): string {
  // https://www.goodreads.com/review/show/123456789 -> 123456789
  const match = link.match(/\/show\/(\d+)/);
  return match?.[1] || link;
}

export async function syncLinkedAccount(
  db: ReturnType<typeof createDb>,
  account: typeof schema.linkedAccounts.$inferSelect
) {
  const items = await parseRSSFeed(account.rssUrl);

  for (const item of items) {
    const consumedAt = item.pubDate ? new Date(item.pubDate) : new Date();
    const yearConsumed = consumedAt.getFullYear();

    const externalId =
      account.type === "letterboxd"
        ? extractLetterboxdId(item.link)
        : extractGoodreadsId(item.link);

    const mediaType = account.type === "letterboxd" ? "movie" : "book";

    // Upsert media item
    const [mediaItem] = await db
      .insert(schema.mediaItems)
      .values({
        type: mediaType,
        externalId,
        source: account.type,
        title: item.title,
      })
      .onConflictDoNothing()
      .returning();

    // Get the media item (either inserted or existing)
    const existingItem =
      mediaItem ||
      (await db.query.mediaItems.findFirst({
        where: and(
          eq(schema.mediaItems.source, account.type),
          eq(schema.mediaItems.externalId, externalId)
        ),
      }));

    if (!existingItem) continue;

    // Upsert media log
    await db
      .insert(schema.mediaLog)
      .values({
        userId: account.userId,
        mediaItemId: existingItem.id,
        consumedAt,
        yearConsumed,
      })
      .onConflictDoNothing();
  }

  // Update last synced timestamp
  await db
    .update(schema.linkedAccounts)
    .set({ lastSyncedAt: new Date() })
    .where(eq(schema.linkedAccounts.id, account.id));
}

export async function syncAllAccounts(db: ReturnType<typeof createDb>) {
  const accounts = await db.query.linkedAccounts.findMany();

  const results = {
    total: accounts.length,
    success: 0,
    failed: 0,
  };

  for (const account of accounts) {
    try {
      await syncLinkedAccount(db, account);
      results.success++;
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
      results.failed++;
    }
  }

  return results;
}
