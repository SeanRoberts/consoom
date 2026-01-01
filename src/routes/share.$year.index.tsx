import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { createAuth } from "../lib/auth";

const getShareData = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const cfEnv = env as CloudflareEnv & {
      BETTER_AUTH_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
    };
    const auth = createAuth(cfEnv);
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return null;
    }

    const db = createDb(cfEnv.DB);

    const logs = await db.query.mediaLog.findMany({
      where: and(
        eq(schema.mediaLog.userId, session.user.id),
        eq(schema.mediaLog.yearConsumed, data.year)
      ),
      with: {
        mediaItem: true,
      },
      orderBy: desc(schema.mediaLog.consumedAt),
    });

    const movies = logs.filter((m) => m.mediaItem.type === "movie");
    const books = logs.filter((m) => m.mediaItem.type === "book");

    return {
      userName: session.user.name,
      movieCount: movies.length,
      bookCount: books.length,
      items: logs.map((m) => ({
        id: m.id,
        title: m.mediaItem.title,
        type: m.mediaItem.type as "movie" | "book",
        consumedAt: m.consumedAt,
        releaseYear: m.mediaItem.releaseYear,
      })),
    };
  });

export const Route = createFileRoute("/share/$year/")({
  loader: async ({ params }) => {
    const year = parseInt(params.year);
    return getShareData({ data: { year } });
  },
  component: ShareIndexPage,
});

function ShareIndexPage() {
  const { year } = Route.useParams();
  const data = useLoaderData({ from: "/share/$year/" });

  if (!data) {
    return (
      <p className="text-muted-foreground">Please log in to view your share page.</p>
    );
  }

  const { userName, movieCount, bookCount, items } = data;

  const allMedia = [...items].sort(
    (a, b) =>
      new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime()
  );

  return (
    <>
      <h1 className="text-xl font-bold mb-1">
        {userName}'s {year}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        {movieCount} movies & {bookCount} books
      </p>

      {allMedia.length === 0 ? (
        <p className="text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <ol className="space-y-1 text-sm">
          {allMedia.map((item, index) => (
            <li key={item.id} className="flex gap-2">
              <span className="text-muted-foreground w-6">{index + 1}.</span>
              <span className="flex-1">
                {item.title}
                {item.releaseYear && (
                  <span className="text-muted-foreground"> ({item.releaseYear})</span>
                )}
              </span>
              <span className="text-muted-foreground">
                (
                {new Date(item.consumedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                )
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
