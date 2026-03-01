import { Router } from "express";
import bcrypt from "bcrypt";
import {
  adminStats,
  createPost,
  ensureUniqueSlug,
  getDb,
  getPostById,
  getSiteSettings,
  listCategories,
  listTags,
  type PostInput,
  slugify,
  updateSiteSettings,
  updatePost,
} from "../db";
import { getAdminById, getAdminByUsername, requireAdmin, verifyPassword } from "../auth";

const router = Router();

function getString(value: unknown): string {
  return String(value || "").trim();
}

function cleanInlineText(value: unknown): string {
  return getString(value).replace(/[<>]/g, "");
}

function getSuccessMessage(code: string): string {
  if (code === "settings-saved") {
    return "Settings updated successfully.";
  }
  if (code === "password-changed") {
    return "Password changed successfully. Please sign in again.";
  }
  return "";
}

function parseTagIds(input: unknown): number[] {
  if (Array.isArray(input)) {
    return input.map((v) => Number.parseInt(String(v), 10)).filter((n) => Number.isInteger(n) && n > 0);
  }
  const single = Number.parseInt(String(input || ""), 10);
  return Number.isInteger(single) && single > 0 ? [single] : [];
}

async function parsePostInput(body: Record<string, unknown>, existingId?: number): Promise<{ input: PostInput; tagIds: number[] }> {
  const title = getString(body.title);
  const manualSlug = getString(body.slug);
  const slug = await ensureUniqueSlug("posts", manualSlug || title, title, existingId);

  const status = getString(body.status) === "published" ? "published" : "draft";
  const publishDate = getString(body.published_at);

  const categoryIdRaw = Number.parseInt(getString(body.category_id), 10);
  const categoryId = Number.isInteger(categoryIdRaw) ? categoryIdRaw : null;

  const input: PostInput = {
    title,
    slug,
    excerpt: getString(body.excerpt),
    content_md: getString(body.content_md),
    cover_image: getString(body.cover_image) || null,
    status,
    published_at: status === "published" ? (publishDate || new Date().toISOString()) : null,
    meta_title: getString(body.meta_title) || null,
    meta_description: getString(body.meta_description) || null,
    category_id: categoryId,
  };

  return { input, tagIds: parseTagIds(body.tag_ids) };
}

router.use((req, res, next) => {
  res.locals.layout = "layouts/admin";
  res.locals.currentPath = req.path;
  res.locals.adminUser = req.session.username || null;
  next();
});

router.get("/login", (_req, res) => {
  const success = getSuccessMessage(getString(_req.query.success));
  res.render("admin/login", {
    pageTitle: "Admin Login | OTR Life",
    metaDescription: "Admin login",
    errors: [],
    success,
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const username = getString(req.body.username);
    const password = String(req.body.password || "");

    const user = getAdminByUsername(username);
    if (!user) {
      return res.status(401).render("admin/login", {
        pageTitle: "Admin Login | OTR Life",
        metaDescription: "Admin login",
        errors: ["Invalid username or password."],
        success: "",
      });
    }

    const ok = verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).render("admin/login", {
        pageTitle: "Admin Login | OTR Life",
        metaDescription: "Admin login",
        errors: ["Invalid username or password."],
        success: "",
      });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    return res.redirect("/admin");
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

router.use(requireAdmin);

router.get("/", (_req, res, next) => {
  try {
    res.render("admin/dashboard", {
      pageTitle: "Dashboard | OTR Life",
      metaDescription: "Admin dashboard",
      stats: adminStats(),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/settings", (_req, res, next) => {
  try {
    res.render("admin/settings", {
      pageTitle: "Site Settings | OTR Life",
      metaDescription: "Manage site settings",
      settings: getSiteSettings(),
      errors: [] as string[],
      success: getSuccessMessage(getString(_req.query.success)),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/settings", (req, res, next) => {
  try {
    const site_title = cleanInlineText(req.body.site_title);
    const tagline = cleanInlineText(req.body.tagline);
    const about_title = cleanInlineText(req.body.about_title);
    const about_body_md = getString(req.body.about_body_md);
    const about_image_url = getString(req.body.about_image_url);

    const errors: string[] = [];
    if (!site_title) {
      errors.push("Site title is required.");
    }
    if (!about_title) {
      errors.push("About title is required.");
    }
    if (!about_body_md) {
      errors.push("About body is required.");
    }
    if (about_image_url) {
      try {
        const parsed = new URL(about_image_url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          errors.push("About image URL must use http or https.");
        }
      } catch {
        errors.push("About image URL must be a valid URL.");
      }
    }

    if (errors.length > 0) {
      return res.status(400).render("admin/settings", {
        pageTitle: "Site Settings | OTR Life",
        metaDescription: "Manage site settings",
        settings: {
          id: 1,
          site_title,
          tagline,
          about_title,
          about_body_md,
          about_image_url,
          updated_at: null,
        },
        errors,
        success: "",
      });
    }

    updateSiteSettings({
      site_title,
      tagline,
      about_title,
      about_body_md,
      about_image_url,
    });

    return res.redirect("/admin/settings?success=settings-saved");
  } catch (err) {
    next(err);
  }
});

router.get("/account", (_req, res, next) => {
  try {
    res.render("admin/account", {
      pageTitle: "Account | OTR Life",
      metaDescription: "Manage admin account",
      errors: [] as string[],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/account/password", async (req, res, next) => {
  try {
    const currentPassword = String(req.body.current_password || "");
    const newPassword = String(req.body.new_password || "");
    const confirmPassword = String(req.body.confirm_password || "");
    const errors: string[] = [];

    if (!currentPassword) {
      errors.push("Current password is required.");
    }
    if (newPassword.length < 10) {
      errors.push("New password must be at least 10 characters.");
    }
    if (newPassword !== confirmPassword) {
      errors.push("New password and confirmation must match.");
    }

    const userId = Number(req.session.userId || 0);
    const admin = userId ? getAdminById(userId) : undefined;
    if (!admin) {
      req.session.destroy(() => {
        res.redirect("/admin/login");
      });
      return;
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      errors.push("Current password is incorrect.");
    }

    if (errors.length > 0) {
      return res.status(400).render("admin/account", {
        pageTitle: "Account | OTR Life",
        metaDescription: "Manage admin account",
        errors,
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const db = getDb();
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newPasswordHash, admin.id);

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return next(destroyErr);
      }
      return res.redirect("/admin/login?success=password-changed");
    });
  } catch (err) {
    next(err);
  }
});

router.get("/posts", (req, res, next) => {
  try {
    const db = getDb();
    const q = getString(req.query.q);
    const status = getString(req.query.status);

    const where: string[] = [];
    const params: unknown[] = [];

    if (q) {
      where.push("(p.title LIKE ? OR p.slug LIKE ? OR p.excerpt LIKE ?)");
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (status === "draft" || status === "published") {
      where.push("p.status = ?");
      params.push(status);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const posts = db
      .prepare(
        `
      SELECT p.id, p.title, p.slug, p.status, p.published_at, p.updated_at, c.name AS category_name
      FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereSql}
      ORDER BY p.updated_at DESC, p.id DESC
    `,
      )
      .all(...params) as any[];

    res.render("admin/posts", {
      pageTitle: "Manage Posts | OTR Life",
      metaDescription: "Admin posts",
      posts,
      filters: { q, status },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/posts/new", (_req, res, next) => {
  try {
    res.render("admin/post-form", {
      pageTitle: "New Post | OTR Life",
      metaDescription: "Create post",
      post: null,
      categories: listCategories(),
      tags: listTags(),
      selectedTagIds: [] as number[],
      errors: [] as string[],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/posts/new", async (req, res, next) => {
  try {
    const { input, tagIds } = await parsePostInput(req.body as Record<string, unknown>);

    if (!input.title || !input.excerpt || !input.content_md) {
      throw new Error("Title, excerpt, and content are required.");
    }

    createPost(input, tagIds);
    return res.redirect("/admin/posts");
  } catch (err) {
    try {
      return res.status(400).render("admin/post-form", {
        pageTitle: "New Post | OTR Life",
        metaDescription: "Create post",
        post: req.body,
        categories: listCategories(),
        tags: listTags(),
        selectedTagIds: parseTagIds(req.body.tag_ids),
        errors: [err instanceof Error ? err.message : "Failed to create post."],
      });
    } catch (renderErr) {
      next(renderErr);
    }
  }
});

router.get("/posts/:id/edit", (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const post = getPostById(id);

    if (!post) {
      return res.status(404).render("public/404", {
        layout: "layouts/admin",
        pageTitle: "Not Found",
        metaDescription: "Not found",
      });
    }

    return res.render("admin/post-form", {
      pageTitle: "Edit Post | OTR Life",
      metaDescription: "Edit post",
      post,
      categories: listCategories(),
      tags: listTags(),
      selectedTagIds: (post as { tag_ids: number[] }).tag_ids,
      errors: [] as string[],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/posts/:id/edit", async (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  try {
    const existing = getPostById(id);
    if (!existing) {
      return res.status(404).render("public/404", {
        layout: "layouts/admin",
        pageTitle: "Not Found",
        metaDescription: "Not found",
      });
    }

    const { input, tagIds } = await parsePostInput(req.body as Record<string, unknown>, id);
    if (!input.title || !input.excerpt || !input.content_md) {
      throw new Error("Title, excerpt, and content are required.");
    }

    updatePost(id, input, tagIds);
    return res.redirect("/admin/posts");
  } catch (err) {
    try {
      return res.status(400).render("admin/post-form", {
        pageTitle: "Edit Post | OTR Life",
        metaDescription: "Edit post",
        post: { ...(req.body as Record<string, unknown>), id },
        categories: listCategories(),
        tags: listTags(),
        selectedTagIds: parseTagIds(req.body.tag_ids),
        errors: [err instanceof Error ? err.message : "Failed to update post."],
      });
    } catch (renderErr) {
      next(renderErr);
    }
  }
});

router.post("/posts/:id/delete", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    res.redirect("/admin/posts");
  } catch (err) {
    next(err);
  }
});

router.post("/api/categories/quick-create", (req, res, next) => {
  try {
    const name = getString(req.body.name);
    if (!name) {
      return res.status(400).json({ error: "Category name is required." });
    }
    const db = getDb();
    const slug = ensureUniqueSlug("categories", getString(req.body.slug), name);
    const result = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
    const id = Number(result.lastInsertRowid);
    return res.json({ id, name, slug });
  } catch (err) {
    next(err);
  }
});

router.post("/api/tags/quick-create", (req, res, next) => {
  try {
    const name = getString(req.body.name);
    if (!name) {
      return res.status(400).json({ error: "Tag name is required." });
    }
    const db = getDb();
    const slug = ensureUniqueSlug("tags", getString(req.body.slug), name);
    const result = db.prepare("INSERT INTO tags (name, slug) VALUES (?, ?)").run(name, slug);
    const id = Number(result.lastInsertRowid);
    return res.json({ id, name, slug });
  } catch (err) {
    next(err);
  }
});

router.get("/categories", (_req, res, next) => {
  try {
    res.render("admin/categories", {
      pageTitle: "Manage Categories | OTR Life",
      metaDescription: "Admin categories",
      categories: listCategories(),
      errors: [] as string[],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/categories/create", (req, res, next) => {
  const name = getString(req.body.name);
  if (!name) {
    try {
      return res.status(400).render("admin/categories", {
        pageTitle: "Manage Categories | OTR Life",
        metaDescription: "Admin categories",
        categories: listCategories(),
        errors: ["Category name is required."],
      });
    } catch (renderErr) {
      next(renderErr);
      return;
    }
  }

  try {
    const db = getDb();
    const slug = ensureUniqueSlug("categories", getString(req.body.slug), name);
    db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
    res.redirect("/admin/categories");
  } catch (err) {
    next(err);
  }
});

router.post("/categories/:id/update", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    const name = getString(req.body.name);
    if (!name) {
      return res.redirect("/admin/categories");
    }
    const slug = ensureUniqueSlug("categories", getString(req.body.slug) || slugify(name), name, id);
    db.prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?").run(name, slug, id);
    res.redirect("/admin/categories");
  } catch (err) {
    next(err);
  }
});

router.post("/categories/:id/delete", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.redirect("/admin/categories");
  } catch (err) {
    next(err);
  }
});

router.get("/tags", (_req, res, next) => {
  try {
    res.render("admin/tags", {
      pageTitle: "Manage Tags | OTR Life",
      metaDescription: "Admin tags",
      tags: listTags(),
      errors: [] as string[],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/tags/create", (req, res, next) => {
  const name = getString(req.body.name);
  if (!name) {
    try {
      return res.status(400).render("admin/tags", {
        pageTitle: "Manage Tags | OTR Life",
        metaDescription: "Admin tags",
        tags: listTags(),
        errors: ["Tag name is required."],
      });
    } catch (renderErr) {
      next(renderErr);
      return;
    }
  }

  try {
    const db = getDb();
    const slug = ensureUniqueSlug("tags", getString(req.body.slug), name);
    db.prepare("INSERT INTO tags (name, slug) VALUES (?, ?)").run(name, slug);
    res.redirect("/admin/tags");
  } catch (err) {
    next(err);
  }
});

router.post("/tags/:id/update", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    const name = getString(req.body.name);
    if (!name) {
      return res.redirect("/admin/tags");
    }
    const slug = ensureUniqueSlug("tags", getString(req.body.slug) || slugify(name), name, id);
    db.prepare("UPDATE tags SET name = ?, slug = ? WHERE id = ?").run(name, slug, id);
    res.redirect("/admin/tags");
  } catch (err) {
    next(err);
  }
});

router.post("/tags/:id/delete", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    db.prepare("DELETE FROM tags WHERE id = ?").run(id);
    res.redirect("/admin/tags");
  } catch (err) {
    next(err);
  }
});

router.get("/messages", (_req, res, next) => {
  try {
    const db = getDb();
    const messages = db
      .prepare("SELECT id, name, email, subject, created_at, is_read FROM messages ORDER BY created_at DESC")
      .all() as any[];

    res.render("admin/messages", {
      pageTitle: "Messages | OTR Life",
      metaDescription: "Admin messages",
      messages,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/messages/:id", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    db.prepare("UPDATE messages SET is_read = 1 WHERE id = ?").run(id);

    const message = db
      .prepare("SELECT id, name, email, subject, body, created_at, is_read FROM messages WHERE id = ?")
      .get(id);

    if (!message) {
      return res.status(404).render("public/404", {
        layout: "layouts/admin",
        pageTitle: "Message Not Found",
        metaDescription: "Not found",
      });
    }

    return res.render("admin/message-view", {
      pageTitle: "View Message | OTR Life",
      metaDescription: "Message details",
      message,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/messages/:id/toggle-read", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    const current = db.prepare("SELECT is_read FROM messages WHERE id = ?").get(id) as { is_read: number } | undefined;
    if (current) {
      db.prepare("UPDATE messages SET is_read = ? WHERE id = ?").run(current.is_read ? 0 : 1, id);
    }
    res.redirect("/admin/messages");
  } catch (err) {
    next(err);
  }
});

router.post("/messages/:id/delete", (req, res, next) => {
  try {
    const db = getDb();
    const id = Number.parseInt(req.params.id, 10);
    db.prepare("DELETE FROM messages WHERE id = ?").run(id);
    res.redirect("/admin/messages");
  } catch (err) {
    next(err);
  }
});

export default router;
