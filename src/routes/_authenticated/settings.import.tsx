import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { importMedia } from "../../server/mutations";

export const Route = createFileRoute("/_authenticated/settings/import")({
  component: ImportPage,
});

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function parseLetterboxdCSV(text: string) {
  const rows = parseCSV(text);
  return rows
    .filter((row) => row["Watched Date"] && row["Name"])
    .map((row) => ({
      title: row["Name"],
      externalId: row["Letterboxd URI"]?.split("/").pop() || row["Name"].toLowerCase().replace(/\s+/g, "-"),
      consumedAt: row["Watched Date"],
      rating: row["Rating"] ? Math.round(parseFloat(row["Rating"]) * 2) : undefined,
    }));
}

function parseGoodreadsCSV(text: string) {
  const rows = parseCSV(text);
  return rows
    .filter((row) => row["Date Read"] && row["Title"] && row["Exclusive Shelf"] === "read")
    .map((row) => ({
      title: row["Title"],
      externalId: row["Book Id"] || row["Title"].toLowerCase().replace(/\s+/g, "-"),
      consumedAt: row["Date Read"],
      rating: row["My Rating"] ? parseInt(row["My Rating"]) : undefined,
    }));
}

function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ type: string; count: number } | null>(null);
  const letterboxdRef = useRef<HTMLInputElement>(null);
  const goodreadsRef = useRef<HTMLInputElement>(null);

  const handleLetterboxdImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const items = parseLetterboxdCSV(text);

      if (items.length === 0) {
        alert("No valid entries found in the CSV. Make sure you're uploading diary.csv from Letterboxd.");
        return;
      }

      const response = await importMedia({ data: { type: "letterboxd", items } });
      setResult({ type: "movies", count: response.imported });
    } catch (error) {
      alert("Failed to import: " + (error as Error).message);
    } finally {
      setImporting(false);
      if (letterboxdRef.current) letterboxdRef.current.value = "";
    }
  };

  const handleGoodreadsImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const items = parseGoodreadsCSV(text);

      if (items.length === 0) {
        alert("No valid entries found in the CSV. Make sure you're uploading your Goodreads library export and that books are marked as 'read'.");
        return;
      }

      const response = await importMedia({ data: { type: "goodreads", items } });
      setResult({ type: "books", count: response.imported });
    } catch (error) {
      alert("Failed to import: " + (error as Error).message);
    } finally {
      setImporting(false);
      if (goodreadsRef.current) goodreadsRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
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
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              Successfully imported {result.count} {result.type}!
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Letterboxd Import</CardTitle>
            <CardDescription>
              Export your data from Letterboxd Settings → Import & Export →
              Export Your Data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your <code className="bg-muted px-1 rounded">diary.csv</code> file to import your watch history.
            </p>
            <input
              ref={letterboxdRef}
              type="file"
              accept=".csv"
              onChange={handleLetterboxdImport}
              disabled={importing}
              className="hidden"
              id="letterboxd-upload"
            />
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => letterboxdRef.current?.click()}
            >
              {importing ? "Importing..." : "Upload diary.csv"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goodreads Import</CardTitle>
            <CardDescription>
              Export your data from Goodreads My Books → Import and Export →
              Export Library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your <code className="bg-muted px-1 rounded">goodreads_library_export.csv</code> file to import your read books.
            </p>
            <input
              ref={goodreadsRef}
              type="file"
              accept=".csv"
              onChange={handleGoodreadsImport}
              disabled={importing}
              className="hidden"
              id="goodreads-upload"
            />
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => goodreadsRef.current?.click()}
            >
              {importing ? "Importing..." : "Upload goodreads_library_export.csv"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
