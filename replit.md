# OTR Life - Trucking Blog Tools

A mobile-first trucking blog and tools website built for over-the-road drivers.

## Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript (compiled via `tsx` for dev, `tsc` for prod)
- **Framework**: Express.js 4
- **Templating**: EJS with express-ejs-layouts
- **Database**: PostgreSQL via Replit's managed Neon-backed database (persistent across deployments)
- **Auth**: bcrypt password hashing, express-session
- **Security**: helmet, express-rate-limit, express-validator

## Project Structure

```
server/         - TypeScript backend source
  index.ts      - Express app entry point
  db.ts         - SQLite database setup and query helpers
  auth.ts       - Authentication helpers
  seed.ts       - DB seeding (admin user + default categories)
  routes/
    public.ts   - Public-facing routes
    admin.ts    - Admin panel routes
views/          - EJS templates
  layouts/      - Base layouts (public, admin)
  public/       - Public pages
  admin/        - Admin pages
public/         - Static assets (CSS, JS)
data/           - SQLite database file (auto-created on first run)
```

## Running

- **Dev**: `npm run dev` (tsx watch, port 5000)
- **Build**: `npm run build` (compiles to dist/)
- **Start**: `npm start` (runs compiled JS)
- **Seed**: `npm run seed` (runs seed manually)

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `SESSION_SECRET` | Session signing secret |
| `ADMIN_USER` | Admin username (used on first run) |
| `ADMIN_PASS` | Admin password (used on first run) |

## Deployment

- Target: **vm** (always-running, needed for SQLite file persistence)
- Build: `npm run build`
- Run: `node dist/server/index.js`
