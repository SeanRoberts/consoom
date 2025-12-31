import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";
import { GoalProgress } from "../components/goal-progress";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session, isPending } = useSession();
  const currentYear = new Date().getFullYear();

  if (isPending) {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8">
        <p>Please log in to view your dashboard.</p>
        <Link to="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  // TODO: Fetch real data from API
  const mockData = {
    movies: { current: 0, target: 52 },
    books: { current: 0, target: 24 },
    recentMedia: [] as Array<{ id: string; title: string; type: string }>,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Consoom</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name}</span>
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
          <GoalProgress type="movie" {...mockData.movies} />
          <GoalProgress type="book" {...mockData.books} />
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
            {mockData.recentMedia.length === 0 ? (
              <p className="text-gray-500">
                No media logged yet. Link your Letterboxd or Goodreads account
                in Settings to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {mockData.recentMedia.map((item) => (
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
