# Consoom - Media Tracking App Design

A personal media consumption tracker that syncs with Letterboxd (movies) and Goodreads (books) to help users track yearly goals and view historical data.

## Tech Stack

- **Framework:** TanStack Start with Vinxi Cloudflare adapter
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1 (SQLite)
- **Background Jobs:** Cloudflare Cron Triggers
- **Auth:** Better Auth with Google OAuth
- **ORM:** Drizzle
- **UI:** shadcn/ui + Tailwind CSS
- **Deployment:** wrangler.toml (no SST/IaC needed)

## Core Features

- Open signup with Google OAuth
- Link Letterboxd and Goodreads accounts via RSS feeds
- CSV import for historical data backfill
- Yearly goals per media type (movies, books)
- Progress tracking with visual progress bars
- Year view with all/movies/books filtering
- Screenshot-friendly share view (simple text list)
- Extensible to TV shows and games later

## Database Schema

```sql
users
├── id (primary key)
├── email
├── name
└── created_at

linked_accounts
├── id
├── user_id → users.id
├── type (letterboxd | goodreads)
├── username
├── rss_url
└── last_synced_at

media_items (canonical - one row per unique movie/book)
├── id
├── type (movie | book)
├── external_id (Letterboxd slug or Goodreads ID)
├── source (letterboxd | goodreads)
├── title
├── poster_url (nullable)
├── author (nullable, for books)
├── release_year (nullable)
└── unique constraint on (source, external_id)

media_log (user consumption records)
├── id
├── user_id → users.id
├── media_item_id → media_items.id
├── consumed_at (full timestamp)
├── year_consumed (denormalized for fast queries)
├── rating (nullable)
└── unique constraint on (user_id, media_item_id, consumed_at)

yearly_goals
├── id
├── user_id → users.id
├── year
├── type (movie | book)
├── target
└── unique constraint on (user_id, year, type)
```

## Routes

```
/                      → Landing page (logged out) or redirect to /dashboard
/login                 → Google OAuth button
/dashboard             → Current year progress + recent activity
/year/:year            → All media for year
/year/:year/movies     → Movies only
/year/:year/books      → Books only
/share/:year           → Screenshot view (all media)
/share/:year/movies    → Screenshot view (movies only)
/share/:year/books     → Screenshot view (books only)
/settings              → Profile, linked accounts, manage goals
/settings/import       → CSV upload for historical data
```

## Page Details

### Dashboard
- Current year's goal progress bars (movies: 12/52, books: 8/24)
- Quick links to previous years with completion stats
- Last 10 items watched/read

### Year View
- Goal progress at top
- Full chronological list of media consumed
- Tab navigation: All | Movies | Books (links to filtered routes)
- Link to share view

### Share View
- Clean white background, no navigation chrome
- Simple text list: "1. Movie Title (Jan 5)"
- Optimized for phone screenshots
- Subtle app watermark at bottom

## Data Syncing

### RSS Feed Sync
- Cloudflare Cron Trigger runs every 30 minutes
- Fetches RSS for all linked accounts
- Upserts into media_items and media_log
- Updates last_synced_at on linked_accounts

**Feed URLs:**
- Letterboxd: `https://letterboxd.com/{username}/rss/`
- Goodreads: `https://www.goodreads.com/review/list_rss/{user_id}?shelf=read`

**RSS parsing extracts:**
- Title, date consumed, rating (if present)
- External ID from item link/guid
- Poster URL from feed image element

### CSV Import
- Letterboxd exports diary.csv with: Date, Name, Year, Rating
- Goodreads exports CSV with: Title, Author, Date Read, My Rating
- Upload parses and bulk inserts
- Dedupes against existing records by (user, external_id, consumed_at)

## Deployment

Single wrangler.toml handles:
- Cloudflare Pages deployment
- D1 database binding
- Cron trigger configuration (every 30 minutes)

```toml
name = "consoom"
compatibility_date = "2024-12-31"

[[d1_databases]]
binding = "DB"
database_name = "consoom-db"
database_id = "<generated>"

[triggers]
crons = ["*/30 * * * *"]
```

Deploy with: `wrangler deploy`

## Future Extensibility

- Additional media types: TV shows, video games
- Additional OAuth providers: GitHub, Discord
- Social features: "Your friends also watched this"
- The normalized media_items table enables these without schema changes
