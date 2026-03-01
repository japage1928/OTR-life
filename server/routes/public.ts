import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { marked } from "marked";
import { getPool, getPostTags, getPublishedPostBySlug, getSiteSettings } from "../db";

const router = Router();

function getSiteUrl(req: { protocol: string; get(name: string): string | undefined }) {
  const host = req.get("host") || "localhost:3000";
  return `${req.protocol}://${host}`;
}

function cleanText(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

function mdToSafeHtml(md: string): string {
  const raw = marked.parse(md || "");
  return String(raw)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ` $1="#"`);
}

function plainTextPreview(input: string, max = 220): string {
  const text = input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function pageMeta(base: {
  title: string;
  description: string;
  canonical?: string;
  og?: Record<string, string>;
  twitter?: Record<string, string>;
}) {
  return {
    pageTitle: base.title,
    metaDescription: base.description,
    canonicalUrl: base.canonical || "",
    og: base.og || {},
    twitter: base.twitter || {},
  };
}

router.use(async (_req, res, next) => {
  try {
    const settings = await getSiteSettings();
    res.locals.siteTitle = settings.site_title || "OTR Life";
    res.locals.siteTagline = settings.tagline || "A trucker-first publication for practical life on the road.";
    next();
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const db = getPool();
    const settings = await getSiteSettings();

    const [latestPostsResult, featuredCatsResult] = await Promise.all([
      db.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.status = 'published'
         ORDER BY p.published_at DESC NULLS LAST, p.id DESC
         LIMIT 6`,
      ),
      db.query(
        `SELECT c.id, c.name, c.slug, COUNT(p.id) AS post_count
         FROM categories c
         LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
         GROUP BY c.id, c.name, c.slug
         ORDER BY post_count DESC, c.name ASC
         LIMIT 4`,
      ),
    ]);

    const aboutBodyHtml = mdToSafeHtml(settings.about_body_md || "");

    res.render("public/home", {
      ...pageMeta({
        title: `${settings.site_title || "OTR Life"} | Practical Guides for Truck Drivers`,
        description: settings.tagline || "Bunk-friendly reading for drivers: gear reviews, money tips, health advice, and apps that matter on the road.",
        canonical: `${getSiteUrl(req)}/`,
      }),
      latestPosts: latestPostsResult.rows,
      featuredCategories: featuredCatsResult.rows,
      settings,
      aboutPreview: plainTextPreview(aboutBodyHtml),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/posts", async (req, res, next) => {
  try {
    const db = getPool();
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const perPage = 8;
    const offset = (page - 1) * perPage;

    const [countResult, postsResult] = await Promise.all([
      db.query("SELECT COUNT(*) AS c FROM posts WHERE status = 'published'"),
      db.query(
        `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.status = 'published'
         ORDER BY p.published_at DESC NULLS LAST, p.id DESC
         LIMIT $1 OFFSET $2`,
        [perPage, offset],
      ),
    ]);

    const total = Number(countResult.rows[0]?.c ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render("public/posts", {
      ...pageMeta({
        title: "All Posts | OTR Life",
        description: "Browse all published articles and guides for truckers on the road.",
        canonical: `${getSiteUrl(req)}/posts?page=${page}`,
      }),
      posts: postsResult.rows,
      pagination: { page, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/post/:slug", async (req, res, next) => {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).render("public/404", {
        ...pageMeta({ title: "Post Not Found | OTR Life", description: "The post you requested does not exist." }),
      });
    }

    const tags = await getPostTags(Number(post.id));
    const html = mdToSafeHtml(String(post.content_md));
    const siteUrl = getSiteUrl(req);
    const canonical = `${siteUrl}/post/${post.slug}`;
    const title = String(post.meta_title || post.title);
    const description = String(post.meta_description || post.excerpt);

    return res.render("public/post", {
      ...pageMeta({
        title: `${title} | OTR Life`,
        description,
        canonical,
        og: { title, description, type: "article", url: canonical, image: String(post.cover_image || "") },
        twitter: { card: "summary_large_image", title, description, image: String(post.cover_image || "") },
      }),
      post,
      tags,
      html,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/category/:slug", async (req, res, next) => {
  try {
    const db = getPool();
    const catResult = await db.query(
      "SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1",
      [req.params.slug],
    );
    const category = catResult.rows[0];
    if (!category) {
      return res.status(404).render("public/404", {
        ...pageMeta({ title: "Category Not Found", description: "Category not found." }),
      });
    }

    const postsResult = await db.query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at
       FROM posts p
       WHERE p.category_id = $1 AND p.status = 'published'
       ORDER BY p.published_at DESC NULLS LAST, p.id DESC`,
      [category.id],
    );

    return res.render("public/category", {
      ...pageMeta({
        title: `${category.name} | OTR Life`,
        description: `Published posts in the ${category.name} category.`,
        canonical: `${getSiteUrl(req)}/category/${category.slug}`,
      }),
      category,
      posts: postsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/tag/:slug", async (req, res, next) => {
  try {
    const db = getPool();
    const tagResult = await db.query("SELECT id, name, slug FROM tags WHERE slug = $1 LIMIT 1", [req.params.slug]);
    const tag = tagResult.rows[0];
    if (!tag) {
      return res.status(404).render("public/404", {
        ...pageMeta({ title: "Tag Not Found", description: "Tag not found." }),
      });
    }

    const postsResult = await db.query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at
       FROM posts p
       INNER JOIN post_tags pt ON pt.post_id = p.id
       WHERE pt.tag_id = $1 AND p.status = 'published'
       ORDER BY p.published_at DESC NULLS LAST, p.id DESC`,
      [tag.id],
    );

    return res.render("public/tag", {
      ...pageMeta({
        title: `${tag.name} | OTR Life`,
        description: `Published posts tagged with ${tag.name}.`,
        canonical: `${getSiteUrl(req)}/tag/${tag.slug}`,
      }),
      tag,
      posts: postsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/about", async (req, res, next) => {
  try {
    const settings = await getSiteSettings();
    const aboutBodyHtml = mdToSafeHtml(settings.about_body_md || "");
    res.render("public/about", {
      ...pageMeta({
        title: `About | ${settings.site_title || "OTR Life"}`,
        description: settings.tagline || "Why this site exists and who it helps.",
        canonical: `${getSiteUrl(req)}/about`,
      }),
      settings,
      aboutBodyHtml,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/contact", (_req, res) => {
  res.render("public/contact", {
    ...pageMeta({
      title: "Contact | OTR Life",
      description: "Send a message to OTR Life.",
      canonical: `${getSiteUrl(_req)}/contact`,
    }),
    formData: { name: "", email: "", subject: "", body: "" },
    errors: [],
    success: false,
  });
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many contact requests from this IP. Please try again later.",
});

router.post(
  "/contact",
  contactLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters."),
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("subject").trim().isLength({ min: 2, max: 120 }).withMessage("Subject must be 2-120 characters."),
    body("body").trim().isLength({ min: 10, max: 5000 }).withMessage("Message must be 10-5000 characters."),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      const formData = {
        name: cleanText(String(req.body.name || "")),
        email: cleanText(String(req.body.email || "")),
        subject: cleanText(String(req.body.subject || "")),
        body: String(req.body.body || "").trim(),
      };

      if (!errors.isEmpty()) {
        return res.status(400).render("public/contact", {
          ...pageMeta({ title: "Contact | OTR Life", description: "Send a message to OTR Life.", canonical: `${getSiteUrl(req)}/contact` }),
          formData,
          errors: errors.array().map((item) => item.msg),
          success: false,
        });
      }

      await getPool().query(
        "INSERT INTO messages (name, email, subject, body) VALUES ($1, $2, $3, $4)",
        [formData.name, formData.email, formData.subject, formData.body],
      );

      return res.render("public/contact", {
        ...pageMeta({ title: "Contact | OTR Life", description: "Send a message to OTR Life.", canonical: `${getSiteUrl(req)}/contact` }),
        formData: { name: "", email: "", subject: "", body: "" },
        errors: [],
        success: true,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml\n");
});

router.get("/sitemap.xml", async (req, res, next) => {
  try {
    const db = getPool();
    const siteUrl = getSiteUrl(req);

    const [postUrls, categoryUrls, tagUrls] = await Promise.all([
      db.query("SELECT slug FROM posts WHERE status = 'published'"),
      db.query(`SELECT DISTINCT c.slug FROM categories c INNER JOIN posts p ON p.category_id = c.id WHERE p.status = 'published'`),
      db.query(`SELECT DISTINCT t.slug FROM tags t INNER JOIN post_tags pt ON pt.tag_id = t.id INNER JOIN posts p ON p.id = pt.post_id WHERE p.status = 'published'`),
    ]);

    const urls: string[] = [
      `${siteUrl}/`,
      `${siteUrl}/posts`,
      `${siteUrl}/tools`,
      `${siteUrl}/tools/fuel-cost`,
      `${siteUrl}/tools/route-log`,
      `${siteUrl}/tools/eta-timezone`,
      `${siteUrl}/about`,
      `${siteUrl}/contact`,
      ...postUrls.rows.map((r: { slug: string }) => `${siteUrl}/post/${r.slug}`),
      ...categoryUrls.rows.map((r: { slug: string }) => `${siteUrl}/category/${r.slug}`),
      ...tagUrls.rows.map((r: { slug: string }) => `${siteUrl}/tag/${r.slug}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>`;
    return res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
});

export default router;
