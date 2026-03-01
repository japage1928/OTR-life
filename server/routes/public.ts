import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { marked } from "marked";
import { getDb, getPostTags, getPublishedPostBySlug, getSiteSettings } from "../db";

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
  if (text.length <= max) {
    return text;
  }
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

router.use((_req, res, next) => {
  const settings = getSiteSettings();
  res.locals.siteTitle = settings.site_title || "OTR Life";
  res.locals.siteTagline = settings.tagline || "A trucker-first publication for practical life on the road.";
  next();
});

router.get("/", (req, res, next) => {
  try {
    const db = getDb();
    const settings = getSiteSettings();

    const latestPosts = db
      .prepare(
        `
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at, c.name AS category_name, c.slug AS category_slug
      FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'published'
      ORDER BY datetime(p.published_at) DESC, p.id DESC
      LIMIT 6
    `,
      )
      .all() as any[];

    const featuredCategories = db
      .prepare(
        `
      SELECT c.id, c.name, c.slug, COUNT(p.id) AS post_count
      FROM categories c
      LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
      GROUP BY c.id, c.name, c.slug
      ORDER BY post_count DESC, c.name ASC
      LIMIT 4
    `,
      )
      .all() as any[];

    const aboutBodyHtml = mdToSafeHtml(settings.about_body_md || "");

    res.render("public/home", {
      ...pageMeta({
        title: `${settings.site_title || "OTR Life"} | Practical Guides for Truck Drivers`,
        description: settings.tagline || "Bunk-friendly reading for drivers: gear reviews, money tips, health advice, and apps that matter on the road.",
        canonical: `${getSiteUrl(req)}/`,
      }),
      latestPosts,
      featuredCategories,
      settings,
      aboutPreview: plainTextPreview(aboutBodyHtml),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/posts", (req, res, next) => {
  try {
    const db = getDb();
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const perPage = 8;
    const offset = (page - 1) * perPage;

    const total = ((db.prepare("SELECT COUNT(*) AS c FROM posts WHERE status = 'published'").get() as {
      c: number;
    })?.c ?? 0) as number;

    const posts = db
      .prepare(
        `
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at, c.name AS category_name, c.slug AS category_slug
      FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'published'
      ORDER BY datetime(p.published_at) DESC, p.id DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(perPage, offset) as any[];

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render("public/posts", {
      ...pageMeta({
        title: "All Posts | OTR Life",
        description: "Browse all published articles and guides for truckers on the road.",
        canonical: `${getSiteUrl(req)}/posts?page=${page}`,
      }),
      posts,
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
        ...pageMeta({
          title: "Post Not Found | Trucking Blog Tools",
          description: "The post you requested does not exist.",
        }),
      });
    }

    const tags = await getPostTags(Number((post as { id: number }).id));
    const html = mdToSafeHtml(String((post as { content_md: string }).content_md));
    const siteUrl = getSiteUrl(req);
    const canonical = `${siteUrl}/post/${(post as { slug: string }).slug}`;

    const title = String((post as { meta_title: string | null; title: string }).meta_title || (post as { title: string }).title);
    const description = String((post as { meta_description: string | null; excerpt: string }).meta_description || (post as { excerpt: string }).excerpt);

    return res.render("public/post", {
      ...pageMeta({
        title: `${title} | Trucking Blog Tools`,
        description,
        canonical,
        og: {
          title,
          description,
          type: "article",
          url: canonical,
          image: String((post as { cover_image: string | null }).cover_image || ""),
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          image: String((post as { cover_image: string | null }).cover_image || ""),
        },
      }),
      post,
      tags,
      html,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/category/:slug", (req, res, next) => {
  try {
    const db = getDb();
    const category = db
      .prepare("SELECT id, name, slug FROM categories WHERE slug = ? LIMIT 1")
      .get(req.params.slug) as { id: number; name: string; slug: string } | undefined;

    if (!category) {
      return res.status(404).render("public/404", {
        ...pageMeta({ title: "Category Not Found", description: "Category not found." }),
      });
    }

    const posts = db
      .prepare(
        `
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at
      FROM posts p
      WHERE p.category_id = ? AND p.status = 'published'
      ORDER BY datetime(p.published_at) DESC, p.id DESC
    `,
      )
      .all(category.id) as any[];

    return res.render("public/category", {
      ...pageMeta({
        title: `${category.name} | OTR Life`,
        description: `Published posts in the ${category.name} category.`,
        canonical: `${getSiteUrl(req)}/category/${category.slug}`,
      }),
      category,
      posts,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/tag/:slug", (req, res, next) => {
  try {
    const db = getDb();
    const tag = db
      .prepare("SELECT id, name, slug FROM tags WHERE slug = ? LIMIT 1")
      .get(req.params.slug) as { id: number; name: string; slug: string } | undefined;

    if (!tag) {
      return res.status(404).render("public/404", {
        ...pageMeta({ title: "Tag Not Found", description: "Tag not found." }),
      });
    }

    const posts = db
      .prepare(
        `
      SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.published_at
      FROM posts p
      INNER JOIN post_tags pt ON pt.post_id = p.id
      WHERE pt.tag_id = ? AND p.status = 'published'
      ORDER BY datetime(p.published_at) DESC, p.id DESC
    `,
      )
      .all(tag.id) as any[];

    return res.render("public/tag", {
      ...pageMeta({
        title: `${tag.name} | OTR Life`,
        description: `Published posts tagged with ${tag.name}.`,
        canonical: `${getSiteUrl(req)}/tag/${tag.slug}`,
      }),
      tag,
      posts,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/about", (req, res) => {
  const settings = getSiteSettings();
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
});

router.get("/contact", (req, res) => {
  res.render("public/contact", {
    ...pageMeta({
      title: "Contact | Trucking Blog Tools",
      description: "Send a message to Trucking Blog Tools.",
      canonical: `${getSiteUrl(req)}/contact`,
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
  (req: Request, res: Response, next: NextFunction) => {
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
          ...pageMeta({
            title: "Contact | OTR Life",
            description: "Send a message to OTR Life.",
            canonical: `${getSiteUrl(req)}/contact`,
          }),
          formData,
          errors: errors.array().map((item) => item.msg),
          success: false,
        });
      }

      const db = getDb();
      db.prepare("INSERT INTO messages (name, email, subject, body) VALUES (?, ?, ?, ?)").run(
        formData.name,
        formData.email,
        formData.subject,
        formData.body,
      );

      return res.render("public/contact", {
        ...pageMeta({
          title: "Contact | OTR Life",
          description: "Send a message to OTR Life.",
          canonical: `${getSiteUrl(req)}/contact`,
        }),
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

router.get("/sitemap.xml", (req, res, next) => {
  try {
    const db = getDb();
    const siteUrl = getSiteUrl(req);

    const postUrls = db.prepare("SELECT slug FROM posts WHERE status = 'published'").all() as Array<{
      slug: string;
    }>;

    const categoryUrls = db
      .prepare(
        `
      SELECT DISTINCT c.slug
      FROM categories c
      INNER JOIN posts p ON p.category_id = c.id
      WHERE p.status = 'published'
    `,
      )
      .all() as Array<{ slug: string }>;

    const tagUrls = db
      .prepare(
        `
      SELECT DISTINCT t.slug
      FROM tags t
      INNER JOIN post_tags pt ON pt.tag_id = t.id
      INNER JOIN posts p ON p.id = pt.post_id
      WHERE p.status = 'published'
    `,
      )
      .all() as Array<{ slug: string }>;

    const urls: string[] = [
      `${siteUrl}/`,
      `${siteUrl}/posts`,
      `${siteUrl}/tools`,
      `${siteUrl}/tools/fuel-cost`,
      `${siteUrl}/tools/route-log`,
      `${siteUrl}/tools/eta-timezone`,
      `${siteUrl}/about`,
      `${siteUrl}/contact`,
      ...postUrls.map((post) => `${siteUrl}/post/${post.slug}`),
      ...categoryUrls.map((cat) => `${siteUrl}/category/${cat.slug}`),
      ...tagUrls.map((tag) => `${siteUrl}/tag/${tag.slug}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${url}</loc></url>`)
      .join("\n")}\n</urlset>`;

    return res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
});

export default router;
