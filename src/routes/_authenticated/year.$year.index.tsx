import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { GoalProgress } from "../../components/goal-progress";
import { getYearlyGoals, getMediaForYear } from "../../server/queries";

export const Route = createFileRoute("/_authenticated/year/$year/")({
  loader: async ({ params }) => {
    const year = parseInt(params.year);
    const [goals, media] = await Promise.all([
      getYearlyGoals({ data: { year } }),
      getMediaForYear({ data: { year } }),
    ]);

    const movieGoal = goals.find((g) => g.type === "movie");
    const bookGoal = goals.find((g) => g.type === "book");
    const movieCount = media.filter((m) => m.mediaItem.type === "movie").length;
    const bookCount = media.filter((m) => m.mediaItem.type === "book").length;

    return {
      movies: { current: movieCount, target: movieGoal?.target ?? 52 },
      books: { current: bookCount, target: bookGoal?.target ?? 24 },
      items: media.map((m) => ({
        id: m.id,
        title: m.mediaItem.title,
        type: m.mediaItem.type as "movie" | "book",
        consumedAt: m.consumedAt,
        rating: m.rating ?? undefined,
      })),
    };
  },
  component: YearIndexPage,
});

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "book";
  consumedAt: Date;
  rating?: number;
}

function YearIndexPage() {
  const { movies, books, items } = useLoaderData({ from: "/_authenticated/year/$year/" });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <GoalProgress type="movie" {...movies} />
        <GoalProgress type="book" {...books} />
      </div>

      <div className="bg-card rounded-lg border p-4">
        <MediaList items={items} />
      </div>
    </>
  );
}

function MediaList({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">No media logged for this year yet.</p>;
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
          {item.rating && (
            <span className="text-sm">{"*".repeat(item.rating)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
