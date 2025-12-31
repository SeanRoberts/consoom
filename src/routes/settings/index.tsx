import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession, signOut } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
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

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = useSession();
  const currentYear = new Date().getFullYear();

  const [letterboxdUsername, setLetterboxdUsername] = useState("");
  const [goodreadsUserId, setGoodreadsUserId] = useState("");
  const [movieGoal, setMovieGoal] = useState("52");
  const [bookGoal, setBookGoal] = useState("24");

  if (!session) {
    return (
      <div className="p-8">
        <Link to="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleLinkLetterboxd = async () => {
    // TODO: Save to database via server function
    console.log("Linking Letterboxd:", letterboxdUsername);
    alert("Letterboxd account linked! (Demo - not saved yet)");
  };

  const handleLinkGoodreads = async () => {
    // TODO: Save to database via server function
    console.log("Linking Goodreads:", goodreadsUserId);
    alert("Goodreads account linked! (Demo - not saved yet)");
  };

  const handleSaveGoals = async () => {
    // TODO: Save to database via server function
    console.log("Saving goals:", { movies: movieGoal, books: bookGoal });
    alert("Goals saved! (Demo - not saved yet)");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Signed in as</p>
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
                <Button onClick={handleLinkLetterboxd}>Link</Button>
              </div>
              <p className="text-xs text-gray-500">
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
                <Button onClick={handleLinkGoodreads}>Link</Button>
              </div>
              <p className="text-xs text-gray-500">
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
            <Button onClick={handleSaveGoals}>Save Goals</Button>
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
