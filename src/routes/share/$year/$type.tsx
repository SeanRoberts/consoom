import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/share/$year/$type")({
  component: ShareTypeViewPage,
});

interface MediaItem {
  id: string;
  title: string;
  consumedAt: Date;
}

function ShareTypeViewPage() {
  const { year, type } = useParams({ from: "/share/$year/$type" });
  const label = type === "movies" ? "Movies" : "Books";

  // TODO: Fetch real filtered data
  const mockData = {
    userName: "User",
    items: [] as MediaItem[],
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">
          {mockData.userName}'s {year} {label}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {mockData.items.length} {label.toLowerCase()}
        </p>

        {mockData.items.length === 0 ? (
          <p className="text-gray-400">Nothing logged yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {mockData.items.map((item, index) => (
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
