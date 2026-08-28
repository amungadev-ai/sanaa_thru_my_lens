# Sanaa Thrumylens — Art Through My Lens

A Kenyan creative-arts blog with a full CMS dashboard, built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma (MySQL).

## Features

### Public Blog
- Editorial home page with featured story, latest grid, category explorer, and sidebar
- Article pages with drop-cap prose, share buttons, related posts, and view tracking
- Category listing pages (`/category/[slug]`)
- About page with mission, stats, and contact CTA
- Client-side search (`/search`)
- RSS feed (`/rss.xml`), sitemap (`/sitemap.xml`), and `robots.txt`
- Responsive design (mobile hamburger nav, sticky footer)
- Warm editorial theme (terracotta / cream / gold) with Playfair Display + Inter

### CMS Dashboard (`/cms`)
- Cookie-based authentication with login at `/cms/login`
- Dashboard with KPI cards (posts, views, subscribers, featured)
- Posts manager: list, search, filter, create, edit, delete, feature toggle
- Post editor with HTML toolbar (headings, bold, italic, quotes, lists, links, images)
- Live Write/Preview toggle, auto-slug, auto reading-time
- Cover image: auto-generate SVG or upload to CDN
- In-content image upload to CDN
- Categories manager (create, delete, live post counts)
- Subscribers manager (search, filter, status toggle, delete, export SQL)
- Site settings (identity, social links, database status)

### Newsletter Subscribe
- Public subscribe form on home page and article pages
- Full lifecycle: subscribe → duplicate detection → unsubscribe → re-subscribe
- Public unsubscribe page at `/unsubscribe`
- Subscriber management in CMS

### CDN Integration
- Image uploads proxy through `cdn.sanaathrumylens.co.ke`
- Authenticated PHP upload endpoint with MIME validation
- 1-year immutable cache headers for images
- CORS restricted to blog domains

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + MySQL (MariaDB 10.6) |
| Auth | Cookie-based session |
| Fonts | Playfair Display (serif) + Inter (sans) |
| Icons | Lucide React |

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
AUTH_SECRET="generate-a-strong-random-secret"
CDN_URL="https://cdn.sanaathrumylens.co.ke"
CDN_API_KEY="your-cdn-api-key"
```

### 3. Set up the database

```bash
bun run db:push    # Create tables
bun run scripts/seed.ts    # Seed categories, admin user, site settings
```

### 4. Run the dev server

```bash
bun run dev
```

Visit `http://localhost:3000`.

### 5. Access the CMS

Navigate to `/cms` and sign in:
- **Email:** `admin@sanaathrumylens.co.ke`
- **Password:** `Admin254!` (change after first login)

## CDN Setup

The `cdn-files/` directory contains everything needed to set up the image CDN:

- `upload.php` — authenticated upload endpoint
- `config.example.php` — API key template
- `.htaccess` — caching, CORS, HTTPS redirect
- `README.md` — full DirectAdmin setup walkthrough

See [`cdn-files/README.md`](cdn-files/README.md) for instructions.

## Project Structure

```
├── prisma/schema.prisma          # Database schema (MySQL)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Blog home
│   │   ├── post/[slug]/          # Article detail
│   │   ├── category/[slug]/      # Category listing
│   │   ├── about/                # About page
│   │   ├── search/               # Search page
│   │   ├── unsubscribe/          # Public unsubscribe
│   │   ├── cms/
│   │   │   ├── login/            # CMS login (no auth)
│   │   │   └── (dashboard)/      # CMS pages (auth required)
│   │   │       ├── page.tsx      # Dashboard
│   │   │       ├── posts/        # Posts list + editor
│   │   │       ├── subscribers/  # Subscriber management
│   │   │       ├── categories/   # Category management
│   │   │       └── settings/     # Site settings
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── blog/                 # SiteHeader, Footer, ArticleCard, etc.
│   │   └── cms/                  # CmsShell, PostEditor
│   └── lib/
│       ├── db.ts                 # Prisma client
│       ├── auth.ts               # Cookie-based auth
│       └── posts.ts              # Post queries and helpers
├── cdn-files/                    # CDN PHP files for DirectAdmin
├── scripts/                      # Seed + utility scripts
└── public/                       # Static assets, cover SVGs
```

## License

© Sanaa Thrumylens. All rights reserved.
