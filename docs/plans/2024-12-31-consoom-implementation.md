# Consoom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a media tracking app that syncs with Letterboxd and Goodreads to track yearly consumption goals.

**Architecture:** TanStack Start full-stack React app deployed to Cloudflare Workers with D1 database. Better Auth handles Google OAuth. Drizzle ORM for type-safe database access. RSS feeds sync media from external platforms via Cloudflare Cron Triggers.

**Tech Stack:** TanStack Start, Cloudflare Workers/D1, Better Auth, Drizzle ORM, shadcn/ui, Tailwind CSS

**Reference:** Design document at `docs/plans/2024-12-31-consoom-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold TanStack Start Project

**Files:**
- Create: `package.json`
- Create: `app.config.ts`
- Create: `tsconfig.json`
- Create: `wrangler.jsonc`
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`

**Step 1: Create TanStack Start project with Cloudflare preset**

```bash
npx create-tanstack-app@latest . --template react-start-cloudflare --package-manager pnpm
```

Select options: TypeScript, Tailwind CSS

**Step 2: Verify project structure exists**

```bash
ls -la src/routes
```

Expected: `__root.tsx`, `index.tsx` files exist

**Step 3: Install additional dependencies**

```bash
pnpm add drizzle-orm better-auth
pnpm add -D drizzle-kit @types/node
```

**Step 4: Start dev server to verify setup**

```bash
pnpm dev
```

Expected: App runs at http://localhost:3000

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold TanStack Start project with Cloudflare preset"
```

---

### Task 2: Configure Wrangler for D1

**Files:**
- Modify: `wrangler.jsonc`

**Step 1: Create D1 database (local for now)**

```bash
npx wrangler d1 create consoom-db
```

Note the database_id from output.

**Step 2: Update wrangler.jsonc with D1 binding**

```jsonc
{
  "name": "consoom",
  "compatibility_date": "2024-12-31",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "consoom-db",
      "database_id": "<paste-from-step-1>"
    }
  ],
  "triggers": {
    "crons": ["*/30 * * * *"]
  }
}
```

**Step 3: Create environment type definition**

Create `src/env.d.ts`:

```typescript
interface CloudflareEnv {
  DB: D1Database;
}

declare module "vinxi/http" {
  interface H3EventContext {
    cf: { env: CloudflareEnv };
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: configure D1 database binding"
```

---

### Task 3: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/card.tsx`
- Modify: `src/styles/globals.css`

**Step 1: Initialize shadcn**

```bash
npx shadcn@canary init
```

Select: New York style, Zinc base color, CSS variables: yes

**Step 2: Add core components**

```bash
npx shadcn@canary add button card progress tabs input label
```

**Step 3: Verify components installed**

```bash
ls src/components/ui
```

Expected: button.tsx, card.tsx, progress.tsx, tabs.tsx, input.tsx, label.tsx

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui components"
```

---

## Phase 2: Database Schema

### Task 4: Create Drizzle Schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`

**Step 1: Create drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
});
```

**Step 2: Create database schema**

Create `src/db/schema.ts`:

```typescript
import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const linkedAccounts = sqliteTable(
  "linked_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["letterboxd", "goodreads"] }).notNull(),
    username: text("username").notNull(),
    rssUrl: text("rss_url").notNull(),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.type)]
);

export const mediaItems = sqliteTable(
  "media_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text("type", { enum: ["movie", "book"] }).notNull(),
    externalId: text("external_id").notNull(),
    source: text("source", { enum: ["letterboxd", "goodreads"] }).notNull(),
    title: text("title").notNull(),
    posterUrl: text("poster_url"),
    author: text("author"),
    releaseYear: integer("release_year"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [unique().on(table.source, table.externalId)]
);

export const mediaLog = sqliteTable(
  "media_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaItemId: text("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    consumedAt: integer("consumed_at", { mode: "timestamp" }).notNull(),
    yearConsumed: integer("year_consumed").notNull(),
    rating: integer("rating"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.mediaItemId, table.consumedAt)]
);

export const yearlyGoals = sqliteTable(
  "yearly_goals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    type: text("type", { enum: ["movie", "book"] }).notNull(),
    target: integer("target").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [unique().on(table.userId, table.year, table.type)]
);
```

**Step 3: Create database instance helper**

Create `src/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
```

**Step 4: Generate migrations**

```bash
pnpm drizzle-kit generate
```

Expected: Migration files created in `drizzle/` folder

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add database schema with Drizzle"
```

---

### Task 5: Apply Database Migrations

**Files:**
- Modify: `drizzle/` (generated)

**Step 1: Apply migrations to local D1**

```bash
npx wrangler d1 execute consoom-db --local --file=./drizzle/0000_*.sql
```

**Step 2: Verify tables exist**

```bash
npx wrangler d1 execute consoom-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Expected: users, sessions, accounts, verifications, linked_accounts, media_items, media_log, yearly_goals

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: apply database migrations"
```

---

## Phase 3: Authentication

### Task 6: Configure Better Auth

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/routes/api/auth/$.ts`
- Create: `.dev.vars`

**Step 1: Create .dev.vars for local secrets**

Create `.dev.vars`:

```
BETTER_AUTH_SECRET=generate-a-random-32-char-string-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Add to `.gitignore`:
```
.dev.vars
```

**Step 2: Create auth server configuration**

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../db";

export function createAuth(env: CloudflareEnv) {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    trustedOrigins: [
      "http://localhost:3000",
      // Add production URL later
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

**Step 3: Create auth client**

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const { signIn, signOut, useSession } = authClient;
```

**Step 4: Create auth API route**

Create `src/routes/api/auth/$.ts`:

```typescript
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createAuth } from "../../../lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request, params }) => {
    const env = (request as any).cf?.env as CloudflareEnv;
    const auth = createAuth(env);
    return auth.handler(request);
  },
  POST: async ({ request, params }) => {
    const env = (request as any).cf?.env as CloudflareEnv;
    const auth = createAuth(env);
    return auth.handler(request);
  },
});
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure Better Auth with Google OAuth"
```

---

### Task 7: Create Login Page

**Files:**
- Create: `src/routes/login.tsx`
- Modify: `src/routes/index.tsx`

**Step 1: Create login page**

Create `src/routes/login.tsx`:

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { signIn, useSession } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (session) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Consoom</CardTitle>
          <CardDescription>
            Track your movies and books across the year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Update index to redirect**

Replace `src/routes/index.tsx`:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // For now, always redirect to login
    // Later: check session and redirect to dashboard if logged in
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
```

**Step 3: Verify login page renders**

```bash
pnpm dev
```

Navigate to http://localhost:3000/login - should see the login card

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add login page with Google OAuth button"
```

---

## Phase 4: Core Pages

### Task 8: Create Dashboard Page

**Files:**
- Create: `src/routes/dashboard.tsx`
- Create: `src/components/goal-progress.tsx`

**Step 1: Create GoalProgress component**

Create `src/components/goal-progress.tsx`:

```typescript
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface GoalProgressProps {
  type: "movie" | "book";
  current: number;
  target: number;
}

export function GoalProgress({ type, current, target }: GoalProgressProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const label = type === "movie" ? "Movies" : "Books";
  const emoji = type === "movie" ? "🎬" : "📚";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>{emoji}</span>
          <span>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm mb-2">
          <span>{current} / {target}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create dashboard page**

Create `src/routes/dashboard.tsx`:

```typescript
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
    recentMedia: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Consoom</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <Link to="/settings">
              <Button variant="outline" size="sm">Settings</Button>
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
                No media logged yet. Link your Letterboxd or Goodreads account in Settings to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {/* TODO: Render recent media */}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Step 3: Verify dashboard renders**

```bash
pnpm dev
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with goal progress cards"
```

---

### Task 9: Create Year View Page

**Files:**
- Create: `src/routes/year/$year.tsx`
- Create: `src/routes/year/$year/$type.tsx`

**Step 1: Create year view page**

Create `src/routes/year/$year.tsx`:

```typescript
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useSession } from "../../lib/auth-client";
import { GoalProgress } from "../../components/goal-progress";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";

export const Route = createFileRoute("/year/$year")({
  component: YearViewPage,
});

function YearViewPage() {
  const { year } = useParams({ from: "/year/$year" });
  const { data: session } = useSession();
  const yearNum = parseInt(year, 10);

  if (!session) {
    return (
      <div className="p-8">
        <Link to="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  // TODO: Fetch real data
  const mockData = {
    movies: { current: 0, target: 52, items: [] },
    books: { current: 0, target: 24, items: [] },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-xl font-bold">{year}</h1>
          </div>
          <Link to="/share/$year" params={{ year }}>
            <Button variant="outline" size="sm">Share</Button>
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
              <Link to="/year/$year" params={{ year }}>All</Link>
            </TabsTrigger>
            <TabsTrigger value="movies" asChild>
              <Link to="/year/$year/$type" params={{ year, type: "movies" }}>Movies</Link>
            </TabsTrigger>
            <TabsTrigger value="books" asChild>
              <Link to="/year/$year/$type" params={{ year, type: "books" }}>Books</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-white rounded-lg border p-4">
          <Outlet />
          {/* Default: show all media */}
          <MediaList items={[...mockData.movies.items, ...mockData.books.items]} />
        </div>
      </main>
    </div>
  );
}

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "book";
  consumedAt: Date;
  rating?: number;
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
            {new Date(item.consumedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          {item.rating && (
            <span className="text-sm">{"★".repeat(item.rating)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

**Step 2: Create filtered type view**

Create `src/routes/year/$year/$type.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/year/$year/$type")({
  component: YearTypeViewPage,
});

function YearTypeViewPage() {
  // This component will be rendered inside the year layout
  // For now, the parent handles all rendering
  // TODO: Fetch and display filtered data
  return null;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add year view with media list and tabs"
```

---

### Task 10: Create Share View Page

**Files:**
- Create: `src/routes/share/$year.tsx`
- Create: `src/routes/share/$year/$type.tsx`

**Step 1: Create share view page**

Create `src/routes/share/$year.tsx`:

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/share/$year")({
  component: ShareViewPage,
});

function ShareViewPage() {
  const { year } = useParams({ from: "/share/$year" });

  // TODO: Fetch real data (this page should work without auth for sharing)
  const mockData = {
    userName: "User",
    movies: [],
    books: [],
  };

  const allMedia = [...mockData.movies, ...mockData.books].sort(
    (a, b) => new Date(a.consumedAt).getTime() - new Date(b.consumedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">{mockData.userName}'s {year}</h1>
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
                  ({new Date(item.consumedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
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
```

**Step 2: Create filtered share view**

Create `src/routes/share/$year/$type.tsx`:

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/share/$year/$type")({
  component: ShareTypeViewPage,
});

function ShareTypeViewPage() {
  const { year, type } = useParams({ from: "/share/$year/$type" });
  const label = type === "movies" ? "Movies" : "Books";

  // TODO: Fetch real filtered data
  const mockData: any[] = [];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-1">{year} {label}</h1>
        <p className="text-gray-500 text-sm mb-6">{mockData.length} {label.toLowerCase()}</p>

        {mockData.length === 0 ? (
          <p className="text-gray-400">Nothing logged yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {mockData.map((item, index) => (
              <li key={item.id} className="flex gap-2">
                <span className="text-gray-400 w-6">{index + 1}.</span>
                <span className="flex-1">{item.title}</span>
                <span className="text-gray-400">
                  ({new Date(item.consumedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
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
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add screenshot-friendly share view"
```

---

### Task 11: Create Settings Page

**Files:**
- Create: `src/routes/settings/index.tsx`
- Create: `src/routes/settings/import.tsx`

**Step 1: Create settings page**

Create `src/routes/settings/index.tsx`:

```typescript
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession, signOut } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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
        <Link to="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleLinkLetterboxd = async () => {
    // TODO: Save to database
    console.log("Linking Letterboxd:", letterboxdUsername);
  };

  const handleLinkGoodreads = async () => {
    // TODO: Save to database
    console.log("Linking Goodreads:", goodreadsUserId);
  };

  const handleSaveGoals = async () => {
    // TODO: Save to database
    console.log("Saving goals:", { movies: movieGoal, books: bookGoal });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
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
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>Connect your movie and book tracking accounts</CardDescription>
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
                Find your ID in your Goodreads profile URL: goodreads.com/user/show/12345678
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
            <CardDescription>Import historical data from exports</CardDescription>
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
```

**Step 2: Create import page stub**

Create `src/routes/settings/import.tsx`:

```typescript
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export const Route = createFileRoute("/settings/import")({
  component: ImportPage,
});

function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="text-xl font-bold">Import Data</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Letterboxd Import</CardTitle>
            <CardDescription>
              Export your data from Letterboxd Settings → Import & Export → Export Your Data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Upload your diary.csv file to import your watch history.
            </p>
            <Button variant="outline" disabled>Coming soon</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goodreads Import</CardTitle>
            <CardDescription>
              Export your data from Goodreads My Books → Import and Export → Export Library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Upload your goodreads_library_export.csv file to import your read books.
            </p>
            <Button variant="outline" disabled>Coming soon</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add settings page with account linking and goals"
```

---

## Phase 5: API & Data Layer

### Task 12: Create Server Functions for Data

**Files:**
- Create: `src/server/queries.ts`
- Create: `src/server/mutations.ts`

**Step 1: Create query functions**

Create `src/server/queries.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";

export const getLinkedAccounts = createServerFn({ method: "GET" })
  .handler(async () => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = ""; // Placeholder

    const accounts = await db.query.linkedAccounts.findMany({
      where: eq(schema.linkedAccounts.userId, userId),
    });

    return accounts;
  });

export const getYearlyGoals = createServerFn({ method: "GET" })
  .validator((data: { year: number }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const goals = await db.query.yearlyGoals.findMany({
      where: and(
        eq(schema.yearlyGoals.userId, userId),
        eq(schema.yearlyGoals.year, data.year)
      ),
    });

    return goals;
  });

export const getMediaForYear = createServerFn({ method: "GET" })
  .validator((data: { year: number; type?: "movie" | "book" }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const logs = await db.query.mediaLog.findMany({
      where: and(
        eq(schema.mediaLog.userId, userId),
        eq(schema.mediaLog.yearConsumed, data.year)
      ),
      with: {
        mediaItem: true,
      },
      orderBy: desc(schema.mediaLog.consumedAt),
    });

    if (data.type) {
      return logs.filter((log) => log.mediaItem.type === data.type);
    }

    return logs;
  });

export const getRecentMedia = createServerFn({ method: "GET" })
  .validator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const logs = await db.query.mediaLog.findMany({
      where: eq(schema.mediaLog.userId, userId),
      with: {
        mediaItem: true,
      },
      orderBy: desc(schema.mediaLog.consumedAt),
      limit: data.limit || 10,
    });

    return logs;
  });
```

**Step 2: Create mutation functions**

Create `src/server/mutations.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "vinxi/http";
import { createDb, schema } from "../db";
import { eq, and } from "drizzle-orm";

export const linkAccount = createServerFn({ method: "POST" })
  .validator((data: { type: "letterboxd" | "goodreads"; username: string }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    const rssUrl = data.type === "letterboxd"
      ? `https://letterboxd.com/${data.username}/rss/`
      : `https://www.goodreads.com/review/list_rss/${data.username}?shelf=read`;

    await db
      .insert(schema.linkedAccounts)
      .values({
        userId,
        type: data.type,
        username: data.username,
        rssUrl,
      })
      .onConflictDoUpdate({
        target: [schema.linkedAccounts.userId, schema.linkedAccounts.type],
        set: {
          username: data.username,
          rssUrl,
        },
      });

    return { success: true };
  });

export const saveYearlyGoal = createServerFn({ method: "POST" })
  .validator((data: { year: number; type: "movie" | "book"; target: number }) => data)
  .handler(async ({ data }) => {
    const event = getEvent();
    const env = event.context.cf.env;
    const db = createDb(env.DB);

    // TODO: Get user ID from session
    const userId = "";

    await db
      .insert(schema.yearlyGoals)
      .values({
        userId,
        year: data.year,
        type: data.type,
        target: data.target,
      })
      .onConflictDoUpdate({
        target: [schema.yearlyGoals.userId, schema.yearlyGoals.year, schema.yearlyGoals.type],
        set: {
          target: data.target,
        },
      });

    return { success: true };
  });
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add server functions for queries and mutations"
```

---

### Task 13: Create RSS Sync Function

**Files:**
- Create: `src/server/sync.ts`
- Create: `src/routes/api/cron.ts`

**Step 1: Create RSS sync logic**

Create `src/server/sync.ts`:

```typescript
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  const response = await fetch(url);
  const text = await response.text();

  // Simple XML parsing - in production, use a proper XML parser
  const items: RSSItem[] = [];
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemXml = match[1];
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

    items.push({ title, link, pubDate });
  }

  return items;
}

function extractLetterboxdId(link: string): string {
  // https://letterboxd.com/user/film/movie-slug/ -> movie-slug
  const match = link.match(/\/film\/([^/]+)/);
  return match?.[1] || link;
}

function extractGoodreadsId(link: string): string {
  // https://www.goodreads.com/review/show/123456789 -> 123456789
  const match = link.match(/\/show\/(\d+)/);
  return match?.[1] || link;
}

export async function syncLinkedAccount(
  db: ReturnType<typeof createDb>,
  account: typeof schema.linkedAccounts.$inferSelect
) {
  const items = await parseRSSFeed(account.rssUrl);

  for (const item of items) {
    const consumedAt = new Date(item.pubDate);
    const yearConsumed = consumedAt.getFullYear();

    const externalId = account.type === "letterboxd"
      ? extractLetterboxdId(item.link)
      : extractGoodreadsId(item.link);

    const mediaType = account.type === "letterboxd" ? "movie" : "book";

    // Upsert media item
    const [mediaItem] = await db
      .insert(schema.mediaItems)
      .values({
        type: mediaType,
        externalId,
        source: account.type,
        title: item.title,
      })
      .onConflictDoNothing()
      .returning();

    // Get the media item (either inserted or existing)
    const existingItem = mediaItem || await db.query.mediaItems.findFirst({
      where: eq(schema.mediaItems.externalId, externalId),
    });

    if (!existingItem) continue;

    // Upsert media log
    await db
      .insert(schema.mediaLog)
      .values({
        userId: account.userId,
        mediaItemId: existingItem.id,
        consumedAt,
        yearConsumed,
      })
      .onConflictDoNothing();
  }

  // Update last synced timestamp
  await db
    .update(schema.linkedAccounts)
    .set({ lastSyncedAt: new Date() })
    .where(eq(schema.linkedAccounts.id, account.id));
}

export async function syncAllAccounts(db: ReturnType<typeof createDb>) {
  const accounts = await db.query.linkedAccounts.findMany();

  for (const account of accounts) {
    try {
      await syncLinkedAccount(db, account);
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
    }
  }
}
```

**Step 2: Create cron API endpoint**

Create `src/routes/api/cron.ts`:

```typescript
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createDb } from "../../db";
import { syncAllAccounts } from "../../server/sync";

export const APIRoute = createAPIFileRoute("/api/cron")({
  GET: async ({ request }) => {
    const env = (request as any).cf?.env as CloudflareEnv;

    // Verify this is a cron request (in production, add proper auth)
    const authHeader = request.headers.get("Authorization");

    const db = createDb(env.DB);
    await syncAllAccounts(db);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add RSS sync for Letterboxd and Goodreads"
```

---

## Phase 6: Deployment

### Task 14: Configure Production Deployment

**Files:**
- Modify: `wrangler.jsonc`
- Create: `.github/workflows/deploy.yml` (optional)

**Step 1: Set production secrets**

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

**Step 2: Create production D1 database**

```bash
npx wrangler d1 create consoom-db-prod
```

Update `wrangler.jsonc` with production database_id.

**Step 3: Apply migrations to production**

```bash
npx wrangler d1 execute consoom-db-prod --file=./drizzle/0000_*.sql
```

**Step 4: Deploy to Cloudflare**

```bash
pnpm build && npx wrangler deploy
```

**Step 5: Configure Google OAuth redirect**

In Google Cloud Console, add the production callback URL:
`https://consoom.<your-subdomain>.workers.dev/api/auth/callback/google`

**Step 6: Commit any config changes**

```bash
git add -A
git commit -m "chore: configure production deployment"
```

---

## Phase 7: Polish (Post-Launch)

### Task 15: Wire Up Real Data to UI

Replace mock data in dashboard, year view, and share view with actual server function calls using TanStack Query.

### Task 16: Implement CSV Import

Add file upload handling and CSV parsing for Letterboxd and Goodreads exports.

### Task 17: Add Error Handling

Add proper error boundaries, loading states, and error messages throughout the app.

### Task 18: Add Manual Sync Button

Allow users to trigger an immediate sync from the settings page.

---

## Quick Reference

**Local Development:**
```bash
pnpm dev                    # Start dev server
npx wrangler d1 execute ... # Run SQL on local D1
```

**Deployment:**
```bash
pnpm build && npx wrangler deploy
```

**Database Migrations:**
```bash
pnpm drizzle-kit generate   # Generate migration
npx wrangler d1 execute consoom-db --local --file=./drizzle/XXXX_*.sql
```
