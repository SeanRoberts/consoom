import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSession } from "../../../lib/auth-client";
import { GoalProgress } from "../../../components/goal-progress";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

export const Route = createFileRoute("/year/$year/$type")({
  component: YearTypeViewPage,
});

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "book";
  consumedAt: Date;
  rating?: number;
}

function YearTypeViewPage() {
  const { year, type } = useParams({ from: "/year/$year/$type" });
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="p-8">
        <Link to="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  const mediaType = type === "movies" ? "movie" : "book";
  const label = type === "movies" ? "Movies" : "Books";

  // TODO: Fetch real data filtered by type
  const mockData = {
    goal: { current: 0, target: type === "movies" ? 52 : 24 },
    items: [] as MediaItem[],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
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
          <GoalProgress type={mediaType} {...mockData.goal} />
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

        <div className="bg-white rounded-lg border p-4">
          {mockData.items.length === 0 ? (
            <p className="text-gray-500">No {label.toLowerCase()} logged for this year yet.</p>
          ) : (
            <ul className="space-y-2">
              {mockData.items.map((item, index) => (
                <li key={item.id} className="flex items-center gap-2 py-1">
                  <span className="text-gray-400 w-6">{index + 1}.</span>
                  <span className="flex-1">{item.title}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(item.consumedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
