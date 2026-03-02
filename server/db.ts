import { Pool } from "pg";

export type PostStatus = "draft" | "published";

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

export interface SiteSettings {
  id: number;
  site_title: string;
  tagline: string;
  about_title: string;
  about_body_md: string;
  about_image_url: string;
  updated_at: string | null;
}

const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, "id" | "updated_at"> = {
  site_title: "OTR Life",
  tagline: "A trucker-first publication for practical life on the road.",
  about_title: "About OTR Life",
  about_body_md: "OTR Life is a blog for over-the-road truck drivers.",
  about_image_url: "",
};

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
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

export async function ensureUniqueSlug(
  table: "posts" | "categories" | "tags",
  requestedSlug: string,
  fallbackSource: string,
  excludeId?: number,
): Promise<string> {
  const db = getPool();
  const base = slugify(requestedSlug || fallbackSource) || `item-${Date.now()}`;

  const countSlug = async (slug: string): Promise<number> => {
    let result;
    if (excludeId) {
      result = await db.query(`SELECT COUNT(*) AS c FROM ${table} WHERE slug = $1 AND id != $2`, [slug, excludeId]);
    } else {
      result = await db.query(`SELECT COUNT(*) AS c FROM ${table} WHERE slug = $1`, [slug]);
    }
    return Number(result.rows[0]?.c ?? 0);
  };

  if ((await countSlug(base)) === 0) {
    return base;
  }

  let i = 2;
  let candidate = `${base}-${i}`;
  while ((await countSlug(candidate)) > 0) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}

export async function listCategories(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const result = await getPool().query("SELECT id, name, slug FROM categories ORDER BY name ASC");
  return result.rows;
}

export async function listTags(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const result = await getPool().query("SELECT id, name, slug FROM tags ORDER BY name ASC");
  return result.rows;
}

export async function getPostTagIds(postId: number): Promise<number[]> {
  const result = await getPool().query("SELECT tag_id FROM post_tags WHERE post_id = $1 ORDER BY tag_id ASC", [postId]);
  return result.rows.map((row: { tag_id: number }) => row.tag_id);
}

export async function getPostById(id: number): Promise<any> {
  const db = getPool();
  const result = await db.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM posts p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id],
  );
  const post = result.rows[0];
  if (!post) return null;
  if (post.published_at instanceof Date) post.published_at = post.published_at.toISOString();
  if (post.created_at instanceof Date) post.created_at = post.created_at.toISOString();
  if (post.updated_at instanceof Date) post.updated_at = post.updated_at.toISOString();
  return { ...post, tag_ids: await getPostTagIds(id) };
}

export async function saveImage(
  filename: string,
  contentType: string,
  data: Buffer,
): Promise<{ id: number; filename: string; content_type: string }> {
  const result = await getPool().query(
    `INSERT INTO images (filename, content_type, data) VALUES ($1, $2, $3) RETURNING id, filename, content_type`,
    [filename, contentType, data],
  );
  return result.rows[0];
}

export async function getImageById(id: number): Promise<{ content_type: string; data: Buffer } | null> {
  const result = await getPool().query(`SELECT content_type, data FROM images WHERE id = $1`, [id]);
  if (!result.rows[0]) return null;
  return result.rows[0];
}

export async function getPublishedPostBySlug(slug: string): Promise<any> {
  const result = await getPool().query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM posts p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.status = 'published'
     LIMIT 1`,
    [slug],
  );
  return result.rows[0] || null;
}

export async function getPostTags(postId: number): Promise<Array<{ id: number; name: string; slug: string }>> {
  const result = await getPool().query(
    `SELECT t.id, t.name, t.slug
     FROM tags t
     INNER JOIN post_tags pt ON pt.tag_id = t.id
     WHERE pt.post_id = $1
     ORDER BY t.name ASC`,
    [postId],
  );
  return result.rows;
}

export async function createPost(input: PostInput, tagIds: number[]): Promise<number> {
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `INSERT INTO posts (title, slug, excerpt, content_md, cover_image, status, published_at,
        created_at, updated_at, meta_title, meta_description, category_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW(),$8,$9,$10)
       RETURNING id`,
      [
        input.title, input.slug, input.excerpt, input.content_md, input.cover_image,
        input.status, input.published_at, input.meta_title, input.meta_description, input.category_id,
      ],
    );
    const postId = Number(res.rows[0].id);
    for (const tagId of tagIds) {
      await client.query("INSERT INTO post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [postId, tagId]);
    }
    await client.query("COMMIT");
    return postId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updatePost(id: number, input: PostInput, tagIds: number[]): Promise<void> {
  const db = getPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE posts
       SET title=$1, slug=$2, excerpt=$3, content_md=$4, cover_image=$5, status=$6,
           published_at=$7, updated_at=NOW(), meta_title=$8, meta_description=$9, category_id=$10
       WHERE id=$11`,
      [
        input.title, input.slug, input.excerpt, input.content_md, input.cover_image,
        input.status, input.published_at, input.meta_title, input.meta_description, input.category_id, id,
      ],
    );
    await client.query("DELETE FROM post_tags WHERE post_id = $1", [id]);
    for (const tagId of tagIds) {
      await client.query("INSERT INTO post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, tagId]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function adminStats(): Promise<{ totalPosts: number; drafts: number; unreadMessages: number }> {
  const db = getPool();
  const [total, drafts, unread] = await Promise.all([
    db.query("SELECT COUNT(*) AS c FROM posts"),
    db.query("SELECT COUNT(*) AS c FROM posts WHERE status = 'draft'"),
    db.query("SELECT COUNT(*) AS c FROM messages WHERE is_read = 0"),
  ]);
  return {
    totalPosts: Number(total.rows[0]?.c ?? 0),
    drafts: Number(drafts.rows[0]?.c ?? 0),
    unreadMessages: Number(unread.rows[0]?.c ?? 0),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const result = await getPool().query(
    "SELECT id, site_title, tagline, about_title, about_body_md, about_image_url, updated_at FROM site_settings WHERE id = 1 LIMIT 1",
  );
  const row = result.rows[0];
  if (!row) {
    return { id: 1, ...DEFAULT_SITE_SETTINGS, updated_at: null };
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

export async function updateSiteSettings(input: {
  site_title: string;
  tagline: string;
  about_title: string;
  about_body_md: string;
  about_image_url: string;
}): Promise<void> {
  const result = await getPool().query(
    `UPDATE site_settings
     SET site_title=$1, tagline=$2, about_title=$3, about_body_md=$4, about_image_url=$5, updated_at=NOW()
     WHERE id=1`,
    [input.site_title, input.tagline, input.about_title, input.about_body_md, input.about_image_url],
  );
  if (result.rowCount === 0) {
    await getPool().query(
      `INSERT INTO site_settings (id, site_title, tagline, about_title, about_body_md, about_image_url, updated_at)
       VALUES (1,$1,$2,$3,$4,$5,NOW())`,
      [input.site_title, input.tagline, input.about_title, input.about_body_md, input.about_image_url],
    );
  }
}
