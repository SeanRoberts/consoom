import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { signOut } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useState } from "react";
import { linkAccount, saveYearlyGoal } from "../../server/mutations";
import { getLinkedAccounts, getYearlyGoals } from "../../server/queries";

const currentYear = new Date().getFullYear();

export const Route = createFileRoute("/_authenticated/settings/")({
  loader: async () => {
    const [accounts, goals] = await Promise.all([
      getLinkedAccounts(),
      getYearlyGoals({ data: { year: currentYear } }),
    ]);
    return { accounts, goals };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { session } = Route.useRouteContext();
  const { accounts, goals } = useLoaderData({ from: "/_authenticated/settings/" });

  const letterboxdAccount = accounts.find((a) => a.type === "letterboxd");
  const goodreadsAccount = accounts.find((a) => a.type === "goodreads");
  const movieGoalData = goals.find((g) => g.type === "movie");
  const bookGoalData = goals.find((g) => g.type === "book");

  const [letterboxdUsername, setLetterboxdUsername] = useState(letterboxdAccount?.username ?? "");
  const [goodreadsUserId, setGoodreadsUserId] = useState(goodreadsAccount?.username ?? "");
  const [movieGoal, setMovieGoal] = useState(movieGoalData?.target?.toString() ?? "52");
  const [bookGoal, setBookGoal] = useState(bookGoalData?.target?.toString() ?? "24");
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleLinkLetterboxd = async () => {
    if (!letterboxdUsername.trim()) return;
    setSaving(true);
    try {
      await linkAccount({ data: { type: "letterboxd", username: letterboxdUsername } });
      alert("Letterboxd account linked!");
    } catch (error) {
      alert("Failed to link account: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoodreads = async () => {
    if (!goodreadsUserId.trim()) return;
    setSaving(true);
    try {
      await linkAccount({ data: { type: "goodreads", username: goodreadsUserId } });
      alert("Goodreads account linked!");
    } catch (error) {
      alert("Failed to link account: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      await saveYearlyGoal({ data: { year: currentYear, type: "movie", target: parseInt(movieGoal) } });
      await saveYearlyGoal({ data: { year: currentYear, type: "book", target: parseInt(bookGoal) } });
      alert("Goals saved!");
    } catch (error) {
      alert("Failed to save goals: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>
              Connect your movie and book tracking accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="letterboxd">Letterboxd Username</Label>
              <div className="flex gap-2">
                <Input
                  id="letterboxd"
                  placeholder="your-username"
                  value={letterboxdUsername}
                  onChange={(e) => setLetterboxdUsername(e.target.value)}
                />
                <Button onClick={handleLinkLetterboxd} disabled={saving}>
                  {saving ? "Saving..." : "Link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find your username at letterboxd.com/your-username
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goodreads">Goodreads User ID</Label>
              <div className="flex gap-2">
                <Input
                  id="goodreads"
                  placeholder="12345678"
                  value={goodreadsUserId}
                  onChange={(e) => setGoodreadsUserId(e.target.value)}
                />
                <Button onClick={handleLinkGoodreads} disabled={saving}>
                  {saving ? "Saving..." : "Link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find your ID in your Goodreads profile URL:
                goodreads.com/user/show/12345678
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{currentYear} Goals</CardTitle>
            <CardDescription>Set your targets for this year</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="movie-goal">Movies</Label>
                <Input
                  id="movie-goal"
                  type="number"
                  value={movieGoal}
                  onChange={(e) => setMovieGoal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-goal">Books</Label>
                <Input
                  id="book-goal"
                  type="number"
                  value={bookGoal}
                  onChange={(e) => setBookGoal(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveGoals} disabled={saving}>
              {saving ? "Saving..." : "Save Goals"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Import historical data from exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings/import">
              <Button variant="outline">Import CSV</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
