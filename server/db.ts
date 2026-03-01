import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type PostStatus = "draft" | "published";

export interface SiteSettings {
  id: 1;
  site_title: string;
  tagline: string;
  about_title: string;
  about_body_md: string;
  about_image_url: string;
  updated_at: string | null;
}

const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, "updated_at"> = {
  id: 1,
  site_title: "OTR Life",
  tagline: "A trucker-first publication for practical life on the road.",
  about_title: "About OTR Life",
  about_body_md:
    "OTR Life is built for long-haul and regional drivers who need practical, field-tested guidance that works from the cab.",
  about_image_url: "",
};

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  content_md: string;
  cover_image: string | null;
  status: PostStatus;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category_id: number | null;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "trucking-blog-tools.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");

  const initDb = dbInstance.transaction(() => {
    dbInstance!.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content_md TEXT NOT NULL,
  cover_image TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'published')) DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meta_title TEXT,
  meta_description TEXT,
  category_id INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  site_title TEXT,
  tagline TEXT,
  about_title TEXT,
  about_body_md TEXT,
  about_image_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
`);

    dbInstance!
      .prepare(
        `
      INSERT OR IGNORE INTO site_settings
        (id, site_title, tagline, about_title, about_body_md, about_image_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      )
      .run(
        DEFAULT_SITE_SETTINGS.id,
        DEFAULT_SITE_SETTINGS.site_title,
        DEFAULT_SITE_SETTINGS.tagline,
        DEFAULT_SITE_SETTINGS.about_title,
        DEFAULT_SITE_SETTINGS.about_body_md,
        DEFAULT_SITE_SETTINGS.about_image_url,
      );
  });

  initDb();

  return dbInstance;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function ensureUniqueSlug(
  table: "posts" | "categories" | "tags",
  requestedSlug: string,
  fallbackSource: string,
  excludeId?: number,
): string {
  const db = getDb();
  const base = slugify(requestedSlug || fallbackSource) || `item-${Date.now()}`;

  const countSlug = (slug: string): number => {
    if (excludeId) {
      const row = db
        .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE slug = ? AND id != ?`)
        .get(slug, excludeId) as { c: number };
      return row?.c ?? 0;
    }
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE slug = ?`).get(slug) as { c: number };
    return row?.c ?? 0;
  };

  if (countSlug(base) === 0) {
    return base;
  }

  let i = 2;
  let candidate = `${base}-${i}`;
  while (countSlug(candidate) > 0) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}

export function listCategories(): Array<{ id: number; name: string; slug: string }> {
  const db = getDb();
  return db.prepare("SELECT id, name, slug FROM categories ORDER BY name ASC").all() as Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export function listTags(): Array<{ id: number; name: string; slug: string }> {
  const db = getDb();
  return db.prepare("SELECT id, name, slug FROM tags ORDER BY name ASC").all() as Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export function getPostTagIds(postId: number): number[] {
  const db = getDb();
  const rows = db.prepare("SELECT tag_id FROM post_tags WHERE post_id = ? ORDER BY tag_id ASC").all(postId) as Array<{
    tag_id: number;
  }>;
  return rows.map((row) => row.tag_id);
}

export function getPostById(id: number): any {
  const db = getDb();
  const post = db
    .prepare(
      `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `,
    )
    .get(id);

  if (!post) {
    return null;
  }

  return {
    ...post,
    tag_ids: getPostTagIds(id),
  };
}

export function getPublishedPostBySlug(slug: string): any {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'published'
    LIMIT 1
  `,
    )
    .get(slug);
}

export function getPostTags(postId: number): Array<{ id: number; name: string; slug: string }> {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT t.id, t.name, t.slug
    FROM tags t
    INNER JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?
    ORDER BY t.name ASC
  `,
    )
    .all(postId) as Array<{ id: number; name: string; slug: string }>;
}

export function createPost(input: PostInput, tagIds: number[]): number {
  const db = getDb();
  const insert = db.transaction(() => {
    const result = db
      .prepare(
        `
      INSERT INTO posts (
        title, slug, excerpt, content_md, cover_image, status, published_at,
        created_at, updated_at, meta_title, meta_description, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?)
    `,
      )
      .run(
        input.title,
        input.slug,
        input.excerpt,
        input.content_md,
        input.cover_image,
        input.status,
        input.published_at,
        input.meta_title,
        input.meta_description,
        input.category_id,
      );

    const postId = Number(result.lastInsertRowid);

    for (const tagId of tagIds) {
      db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)").run(postId, tagId);
    }

    return postId;
  });

  return insert();
}

export function updatePost(id: number, input: PostInput, tagIds: number[]): void {
  const db = getDb();
  const update = db.transaction(() => {
    db.prepare(
      `
      UPDATE posts
      SET title = ?, slug = ?, excerpt = ?, content_md = ?, cover_image = ?, status = ?,
          published_at = ?, updated_at = CURRENT_TIMESTAMP,
          meta_title = ?, meta_description = ?, category_id = ?
      WHERE id = ?
    `,
    ).run(
      input.title,
      input.slug,
      input.excerpt,
      input.content_md,
      input.cover_image,
      input.status,
      input.published_at,
      input.meta_title,
      input.meta_description,
      input.category_id,
      id,
    );

    db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(id);
    for (const tagId of tagIds) {
      db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)").run(id, tagId);
    }
  });

  update();
}

export function adminStats(): { totalPosts: number; drafts: number; unreadMessages: number } {
  const db = getDb();
  const totalPosts = ((db.prepare("SELECT COUNT(*) AS c FROM posts").get() as { c: number })?.c ?? 0) as number;
  const drafts = ((db.prepare("SELECT COUNT(*) AS c FROM posts WHERE status = 'draft'").get() as { c: number })?.c ??
    0) as number;
  const unreadMessages = ((db.prepare("SELECT COUNT(*) AS c FROM messages WHERE is_read = 0").get() as {
    c: number;
  })?.c ?? 0) as number;
  return { totalPosts, drafts, unreadMessages };
}

export function getSiteSettings(): SiteSettings {
  const db = getDb();
  const row = db
    .prepare(
      `
    SELECT id, site_title, tagline, about_title, about_body_md, about_image_url, updated_at
    FROM site_settings
    WHERE id = 1
    LIMIT 1
  `,
    )
    .get() as Partial<SiteSettings> | undefined;

  if (!row) {
    return {
      ...DEFAULT_SITE_SETTINGS,
      updated_at: null,
    };
  }

  return {
    id: 1,
    site_title: String(row.site_title || DEFAULT_SITE_SETTINGS.site_title),
    tagline: String(row.tagline || DEFAULT_SITE_SETTINGS.tagline),
    about_title: String(row.about_title || DEFAULT_SITE_SETTINGS.about_title),
    about_body_md: String(row.about_body_md || DEFAULT_SITE_SETTINGS.about_body_md),
    about_image_url: String(row.about_image_url || DEFAULT_SITE_SETTINGS.about_image_url),
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

export function updateSiteSettings(input: {
  site_title: string;
  tagline: string;
  about_title: string;
  about_body_md: string;
  about_image_url: string;
}): void {
  const db = getDb();
  const result = db
    .prepare(
      `
    UPDATE site_settings
    SET site_title = ?, tagline = ?, about_title = ?, about_body_md = ?, about_image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `,
    )
    .run(input.site_title, input.tagline, input.about_title, input.about_body_md, input.about_image_url);

  if (result.changes === 0) {
    db.prepare(
      `
      INSERT INTO site_settings
        (id, site_title, tagline, about_title, about_body_md, about_image_url, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    ).run(input.site_title, input.tagline, input.about_title, input.about_body_md, input.about_image_url);
  }
}
