import { createFileRoute, Link, Outlet, useMatch } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";

export const Route = createFileRoute("/_authenticated/year/$year")({
  component: YearLayout,
});

function YearLayout() {
  const { year } = Route.useParams();
  const typeMatch = useMatch({ from: "/_authenticated/year/$year/$type", shouldThrow: false });
  const currentTab = typeMatch?.params.type ?? "all";

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
        <Tabs value={currentTab} className="mb-6">
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

        <Outlet />
      </main>
    </div>
  );
}
