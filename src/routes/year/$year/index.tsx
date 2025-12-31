import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSession } from "../../../lib/auth-client";
import { GoalProgress } from "../../../components/goal-progress";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

export const Route = createFileRoute("/year/$year/")({
  component: YearViewPage,
});

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "book";
  consumedAt: Date;
  rating?: number;
}

function YearViewPage() {
  const { year } = useParams({ from: "/year/$year/" });
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

  // TODO: Fetch real data
  const mockData = {
    movies: { current: 0, target: 52 },
    books: { current: 0, target: 24 },
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
            <h1 className="text-xl font-bold">{year}</h1>
          </div>
          <Link to="/share/$year" params={{ year }}>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <GoalProgress type="movie" {...mockData.movies} />
          <GoalProgress type="book" {...mockData.books} />
        </div>

        <Tabs defaultValue="all" className="mb-6">
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
          <MediaList items={mockData.items} />
        </div>
      </main>
    </div>
  );
}

function MediaList({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500">No media logged for this year yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-2 py-1">
          <span className="text-gray-400 w-6">{index + 1}.</span>
          <span className="flex-1">{item.title}</span>
          <span className="text-sm text-gray-500">
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
