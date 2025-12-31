import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export const Route = createFileRoute("/settings/import")({
  component: ImportPage,
});

function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Import Data</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Letterboxd Import</CardTitle>
            <CardDescription>
              Export your data from Letterboxd Settings - Import & Export -
              Export Your Data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Upload your diary.csv file to import your watch history.
            </p>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goodreads Import</CardTitle>
            <CardDescription>
              Export your data from Goodreads My Books - Import and Export -
              Export Library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Upload your goodreads_library_export.csv file to import your read
              books.
            </p>
            <Button variant="outline" disabled>
              Coming soon
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
