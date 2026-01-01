import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { GoalProgress } from "../../components/goal-progress";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { getYearlyGoals, getMediaForYear } from "../../server/queries";

export const Route = createFileRoute("/_authenticated/year/$year/$type")({
  loader: async ({ params }) => {
    const year = parseInt(params.year);
    const mediaType = params.type === "movies" ? "movie" : "book";

    const [goals, media] = await Promise.all([
      getYearlyGoals({ data: { year } }),
      getMediaForYear({ data: { year, type: mediaType } }),
    ]);

    const goal = goals.find((g) => g.type === mediaType);

    return {
      goal: { current: media.length, target: goal?.target ?? (mediaType === "movie" ? 52 : 24) },
      items: media.map((m) => ({
        id: m.id,
        title: m.mediaItem.title,
        consumedAt: m.consumedAt,
        rating: m.rating ?? undefined,
      })),
    };
  },
  component: YearTypeViewPage,
});

interface MediaItem {
  id: string;
  title: string;
  consumedAt: Date;
  rating?: number;
}

function YearTypeViewPage() {
  const { year, type } = Route.useParams();
  const { goal, items } = useLoaderData({ from: "/_authenticated/year/$year/$type" });

  const mediaType = type === "movies" ? "movie" : "book";
  const label = type === "movies" ? "Movies" : "Books";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">
              {year} {label}
            </h1>
          </div>
          <Link to="/share/$year/$type" params={{ year, type }}>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <GoalProgress type={mediaType} {...goal} />
        </div>

        <Tabs value={type} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link to="/year/$year" params={{ year }}>
                All
              </Link>
            </TabsTrigger>
            <TabsTrigger value="movies" asChild>
              <Link to="/year/$year/$type" params={{ year, type: "movies" }}>
                Movies
              </Link>
            </TabsTrigger>
            <TabsTrigger value="books" asChild>
              <Link to="/year/$year/$type" params={{ year, type: "books" }}>
                Books
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-card rounded-lg border p-4">
          <MediaList items={items} label={label} />
        </div>
      </main>
    </div>
  );
}

function MediaList({ items, label }: { items: MediaItem[]; label: string }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">No {label.toLowerCase()} logged for this year yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-2 py-1">
          <span className="text-muted-foreground w-6">{index + 1}.</span>
          <span className="flex-1">{item.title}</span>
          <span className="text-sm text-muted-foreground">
            {new Date(item.consumedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
