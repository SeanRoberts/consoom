# Consoom

Track your movies and books across the year. Syncs with Letterboxd and Goodreads via RSS feeds.

## Features

- Google OAuth login
- Link Letterboxd and Goodreads accounts
- Yearly goals with progress tracking
- View media by year (all/movies/books)
- Screenshot-friendly share view
- RSS sync every 30 minutes via cron

## Tech Stack

- **Framework:** TanStack Start
- **Hosting:** Cloudflare Workers/Pages
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** Better Auth with Google OAuth
- **ORM:** Drizzle
- **UI:** shadcn/ui + Tailwind CSS

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your secrets:
- `BETTER_AUTH_SECRET`: Generate a random 32+ character string
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:5173/api/auth/callback/google`

### 4. Run local database migrations

```bash
npx wrangler d1 execute consoom-db --local --file=./drizzle/0000_tense_genesis.sql
```

### 5. Start dev server

```bash
pnpm dev
```

## Production Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create D1 database

```bash
npx wrangler d1 create consoom-db
```

Update `wrangler.jsonc` with the returned `database_id`.

### 3. Apply migrations

```bash
npx wrangler d1 execute consoom-db --file=./drizzle/0000_tense_genesis.sql
```

### 4. Set secrets

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 5. Update Google OAuth

Add production callback URL in Google Cloud Console:
`https://consoom.<your-subdomain>.workers.dev/api/auth/callback/google`

### 6. Deploy

```bash
pnpm build && npx wrangler deploy
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn components
│   └── goal-progress.tsx
├── db/              # Database schema and helpers
├── lib/             # Auth configuration
├── routes/          # TanStack Start routes
│   ├── api/         # API routes
│   ├── settings/    # Settings pages
│   ├── share/       # Share views
│   └── year/        # Year views
└── server/          # Server functions
    ├── queries.ts   # Data queries
    ├── mutations.ts # Data mutations
    └── sync.ts      # RSS sync logic
```

## License

MIT
