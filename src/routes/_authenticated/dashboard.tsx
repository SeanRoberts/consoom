import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { GoalProgress } from "../../components/goal-progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getYearlyGoals, getMediaForYear, getRecentMedia } from "../../server/queries";

const currentYear = new Date().getFullYear();

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async () => {
    const [goals, mediaThisYear, recentMedia] = await Promise.all([
      getYearlyGoals({ data: { year: currentYear } }),
      getMediaForYear({ data: { year: currentYear } }),
      getRecentMedia({ data: { limit: 5 } }),
    ]);

    const movieGoal = goals.find((g) => g.type === "movie");
    const bookGoal = goals.find((g) => g.type === "book");
    const movieCount = mediaThisYear.filter((m) => m.mediaItem.type === "movie").length;
    const bookCount = mediaThisYear.filter((m) => m.mediaItem.type === "book").length;

    return {
      movies: { current: movieCount, target: movieGoal?.target ?? 52 },
      books: { current: bookCount, target: bookGoal?.target ?? 24 },
      recentMedia: recentMedia.map((m) => ({
        id: m.id,
        title: m.mediaItem.title,
        type: m.mediaItem.type,
      })),
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();
  const { movies, books, recentMedia } = useLoaderData({ from: "/_authenticated/dashboard" });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Consoom</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">{currentYear} Progress</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <GoalProgress type="movie" {...movies} />
          <GoalProgress type="book" {...books} />
        </div>

        <div className="flex gap-4 mb-8">
          <Link to="/year/$year" params={{ year: String(currentYear) }}>
            <Button>View {currentYear}</Button>
          </Link>
          <Link to="/year/$year" params={{ year: String(currentYear - 1) }}>
            <Button variant="outline">View {currentYear - 1}</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMedia.length === 0 ? (
              <p className="text-muted-foreground">
                No media logged yet. Link your Letterboxd or Goodreads account
                in Settings to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentMedia.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
