import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { createAuth } from "../lib/auth";

const getShareTypeData = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number; type: "movie" | "book" }) => data)
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

    const filtered = logs.filter((m) => m.mediaItem.type === data.type);

    return {
      userName: session.user.name,
      items: filtered.map((m) => ({
        id: m.id,
        title: m.mediaItem.title,
        consumedAt: m.consumedAt,
        releaseYear: m.mediaItem.releaseYear,
      })),
    };
  });

export const Route = createFileRoute("/share/$year/$type")({
  loader: async ({ params }) => {
    const year = parseInt(params.year);
    const mediaType = params.type === "movies" ? "movie" : "book";
    return getShareTypeData({ data: { year, type: mediaType } });
  },
  component: ShareTypeViewPage,
});

function ShareTypeViewPage() {
  const { year, type } = Route.useParams();
  const data = useLoaderData({ from: "/share/$year/$type" });
  const label = type === "movies" ? "Movies" : "Books";

  if (!data) {
    return (
      <div className="min-h-screen bg-card p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your share page.</p>
      </div>
    );
  }

  const { userName, items } = data;

  return (
    <div className="min-h-screen bg-card p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">
          {userName}'s {year} {label}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {items.length} {label.toLowerCase()}
        </p>

        {items.length === 0 ? (
          <p className="text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {items.map((item, index) => (
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

        <p className="text-xs text-muted-foreground mt-8 text-center">consoom.app</p>
      </div>
    </div>
  );
}
