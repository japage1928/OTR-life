# TruckerTools Blog + Tools

## Overview
A mobile-first trucking blog with a protected admin CMS. Built with Express + React (Vite), PostgreSQL, Tailwind CSS.

## Recent Changes
- 2026-02-22: Initial build - schema, frontend pages, backend API, seed data, admin CMS

## Architecture
- **Frontend**: React 18 with wouter routing, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with express-session (pg-backed), bcryptjs auth
- **Database**: PostgreSQL via Drizzle ORM
- **Rendering**: Client-side SPA (SSR-compatible structure for future migration)

## Key Files
- `shared/schema.ts` - Database schema (users, posts, categories, tags, links, post_categories, post_tags)
- `server/routes.ts` - All API routes (public + admin)
- `server/storage.ts` - Database storage layer (DatabaseStorage)
- `server/seed.ts` - Seed data (admin user, categories, tags, sample posts)
- `client/src/App.tsx` - Frontend router with all routes

## Admin Access
- URL: `/admin/login`
- Default credentials: `admin@truckertools.com` / `admin123`
- Set via env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## API Routes
### Public
- `GET /api/posts` - Published posts
- `GET /api/posts/:slug` - Single post
- `GET /api/search?q=` - Search posts
- `GET /api/categories` - All categories
- `GET /api/categories/:slug/posts` - Posts by category
- `GET /api/tags` - All tags
- `GET /api/tags/:slug/posts` - Posts by tag
- `GET /sitemap.xml` - Dynamic sitemap
- `GET /robots.txt` - Robots file

### Admin (requires auth)
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/me` - Current user
- `GET/POST /api/admin/posts` - List/create posts
- `GET/PUT/DELETE /api/admin/posts/:id` - Single post CRUD
- `POST/PUT/DELETE /api/admin/categories/:id` - Category CRUD
- `POST/PUT/DELETE /api/admin/tags/:id` - Tag CRUD
- `GET/POST/DELETE /api/admin/links` - Link library CRUD

## User Preferences
- Mobile-first design
- Minimal dependencies
- No always-on deployment during development
- Custom admin auth (bcrypt + httpOnly sessions)
