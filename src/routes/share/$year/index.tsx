import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/share/$year/")({
  component: ShareViewPage,
});

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "book";
  consumedAt: Date;
}

function ShareViewPage() {
  const { year } = useParams({ from: "/share/$year/" });

  // TODO: Fetch real data (this page should work without auth for sharing)
  const mockData = {
    userName: "User",
    movies: [] as MediaItem[],
    books: [] as MediaItem[],
  };

  const allMedia = [...mockData.movies, ...mockData.books].sort(
    (a, b) =>
      new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">
          {mockData.userName}'s {year}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {allMedia.length} movies & books
        </p>

        {allMedia.length === 0 ? (
          <p className="text-gray-400">Nothing logged yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {allMedia.map((item, index) => (
              <li key={item.id} className="flex gap-2">
                <span className="text-gray-400 w-6">{index + 1}.</span>
                <span className="flex-1">{item.title}</span>
                <span className="text-gray-400">
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

        <p className="text-xs text-gray-300 mt-8 text-center">consoom.app</p>
      </div>
    </div>
  );
}
