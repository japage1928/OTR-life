# OTR Life Blog CMS

A full-stack blog CMS designed specifically for truck drivers. Dark-themed, low-distraction, optimized for reading in the bunk or at a truck stop. Built with Node.js, TypeScript, Express, EJS, and SQLite.

## Features

### Public Site
- **Home**: Featured categories, latest posts
- **Posts**: Paginated post listing (8 per page)
- **Post Detail**: Full markdown-rendered content with tags and metadata
- **Categories**: Browse posts by category
- **Tags**: Browse posts by tag
- **About**: Site information page
- **Contact**: Contact form with rate limiting
- **Sitemap & Robots**: SEO-friendly XML sitemap and robots.txt
- **Responsive Design**: Mobile-first, readable on all devices
- **Dark Theme**: Easy on the eyes, optimized for low-light reading

### Admin Dashboard
- **Login**: Session-based admin authentication
- **Dashboard**: Quick stats overview
- **Posts**: Create, view, edit, delete posts with markdown support
  - Slug management (auto-generated, editable)
  - Draft/Published status
  - Category assignment (single)
  - Tag assignment (multiple)
  - Cover image URL
  - SEO metadata (title, description)
  - Publish date control
- **Categories**: Manage blog categories
- **Tags**: Manage blog tags
- **Messages**: View and manage contact form submissions

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Rendering**: EJS (server-side)
- **Database**: SQLite 3 with better-sqlite3
- **Authentication**: bcrypt + express-session
- **Markdown**: marked
- **Input Validation**: express-validator
- **Security**: helmet
- **Rate Limiting**: express-rate-limit

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Local Development

1. **Clone or extract** the project:
   ```bash
   cd Trucking-Blog-Tools
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `ADMIN_USER` - admin username
   - `ADMIN_PASS` - admin password
   - `SESSION_SECRET` - random secure string for session cookies
   - `PORT` - (optional, defaults to 3000)

4. **Run seed** (creates database schema and admin user):
   ```bash
   npm run seed
   ```

5. **Start dev server** (with auto-reload):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

6. **Admin login**:
   - Navigate to http://localhost:3000/admin/login
   - Use credentials from your `.env` file
   - Create your first blog post!

## Production Deployment

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Start
```bash
npm start
```

The server will start on `process.env.PORT` (default 3000) and listen on all interfaces (`0.0.0.0`).

### Replit Deployment

1. Create a new Replit project from GitHub repo (or upload files)
2. Set environment variables in Replit Secrets:
   - `ADMIN_USER`
   - `ADMIN_PASS`
   - `SESSION_SECRET` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV` = `production`
3. Run in Replit console:
   ```bash
   npm install && npm run seed && npm start
   ```
4. Replit will provide a public URL

### Other Platforms (Heroku, Railway, Fly.io, etc.)

1. Build: `npm run build`
2. Start: `npm start`
3. Set environment variables via platform dashboard
4. Database persists in `data/` - ensure the platform keeps this directory across deployments

## Project Structure

```
.
├── server/                  # TypeScript backend
│   ├── index.ts            # Express app and routing
│   ├── db.ts               # Database functions (SQLite)
│   ├── auth.ts             # Password hashing and auth middleware
│   ├── seed.ts             # Database initialization
│   └── routes/
│       ├── public.ts       # Public routes (/, /posts, etc.)
│       └── admin.ts        # Admin routes and dashboard
├── views/                  # EJS templates
│   ├── layouts/
│   │   ├── public.ejs      # Public site layout
│   │   └── admin.ejs       # Admin layout
│   ├── public/             # Public pages
│   │   ├── home.ejs
│   │   ├── posts.ejs
│   │   ├── post.ejs
│   │   ├── category.ejs
│   │   ├── tag.ejs
│   │   ├── about.ejs
│   │   ├── contact.ejs
│   │   ├── 404.ejs
│   │   └── 500.ejs
│   └── admin/              # Admin pages
│       ├── login.ejs
│       ├── dashboard.ejs
│       ├── posts.ejs
│       ├── post-form.ejs
│       ├── categories.ejs
│       ├── tags.ejs
│       ├── messages.ejs
│       └── message-view.ejs
├── public/                 # Static assets
│   ├── css/
│   │   └── styles.css      # Dark theme CSS
│   └── js/
│       ├── site.js         # Public site JS
│       └── admin.js        # Admin JS
├── data/                   # SQLite database (created at runtime)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Database Schema

### Users
```sql
id (PK), username (UNIQUE), password_hash, created_at
```

### Categories
```sql
id (PK), name, slug (UNIQUE)
```

### Tags
```sql
id (PK), name, slug (UNIQUE)
```

### Posts
```sql
id (PK), title, slug (UNIQUE), excerpt, content_md (markdown),
cover_image (URL), status (draft|published), published_at,
created_at, updated_at, meta_title, meta_description, category_id (FK)
```

### Post_Tags
```sql
post_id (FK), tag_id (FK), PRIMARY KEY (post_id, tag_id)
```

### Messages
```sql
id (PK), name, email, subject, body, created_at, is_read
```

## Content Guidelines

### Best Practices

- **Slugs**: Auto-generated from title, but editable for clean URLs
- **Excerpts**: Important! Used on listings, in SEO, and social sharing
- **Meta Descriptions**: If not provided, defaults to excerpt
- **Cover Images**: Paste full image URLs (host elsewhere)
- **Markdown**: Full markdown support for bold, italic, lists, code, links
- **Categories**: One per post. Smart for organization.
- **Tags**: Multiple allowed. Use for topics/keywords within a post
- **Drafts**: Won't appear publicly. Good for work-in-progress

## Customization

### Branding
- Update logo/brand name: `views/layouts/public.ejs` line 30
- Update footer: `views/layouts/public.ejs` lines 45-47
- Update about page: `views/public/about.ejs`

### Colors
Edit `public/css/styles.css` at the top:
```css
:root {
  --bg: #0f1113;           /* Main background */
  --bg-soft: #1b1f24;      /* Lighter background */
  --panel: #1b2027;        /* Card background */
  --text: #e6e6e6;         /* Main text */
  --muted: #9aa3ad;        /* Secondary text */
  --accent: #d98e04;       /* Orange accent (buttons, highlights) */
}
```

### Typography
CSS variables for fonts and scales in `styles.css` make it easy to adjust sizing.

## Email Integration (Not Included)

Contact form submissions are stored in the database. To add email notifications:

1. Install `nodemailer` or similar
2. Modify the POST `/contact` route in `server/routes/public.ts`
3. Add email service configuration to `.env`

## Security Notes

- **Passwords**: Hashed with bcrypt (12 rounds)
- **Sessions**: HTTP-only cookies, SameSite=Lax
- **CSRF**: Add middleware if accepting POST from external forms
- **Input**: Validated and sanitized server-side
- **Headers**: Helmet.js for security headers

For production:
- Use strong `SESSION_SECRET` (32+ random characters)
- Set `NODE_ENV=production`
- Use HTTPS
- Regularly update dependencies

## Troubleshooting

### "Database is locked"
This shouldn't happen with better-sqlite3, but if it does, check if another process is using the database file.

### "Admin user not found"
Run `npm run seed` to initialize the database and create the admin user from your `.env` variables.

### "Port already in use"
Change `PORT` in `.env`, or kill the process using it.

### Posts not showing on homepage
Make sure they're marked **Published** (not Draft) and have a `published_at` date set.

### Contact form not submitting
Check browser console for validation errors. Form is rate-limited to 5 requests per 15 minutes per IP.

## Development Tips

- **Hot Reload**: `npm run dev` watches server files
- **Debug Issues**: Check `console.log()` output in terminal
- **Test Routes**: Use Postman or curl
- **Clear Database**: Delete `data/trucking-blog-tools.db` and run `npm run seed` again

## License

MIT

## Built For

Long-haul and regional OTR drivers who need low-distraction, high-contrast, fast-loading content. No bloatware, no tracking, no noise.

---

**Questions?** Contact via the site's contact form, or check the code—it's yours to modify and improve.