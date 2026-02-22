import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import bcrypt from "bcryptjs";
import { insertPostSchema, insertCategorySchema, insertTagSchema, insertLinkSchema } from "@shared/schema";

const PgSession = connectPgSimple(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Email and password required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      (req.session as any).userId = user.id;
      res.json({ id: user.id, email: user.email });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/admin/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ id: user.id, email: user.email });
  });

  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getPosts(true);
    res.json(posts);
  });

  app.get("/api/posts/:slug", async (req, res) => {
    const post = await storage.getPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.get("/api/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const results = await storage.searchPosts(q);
    res.json(results);
  });

  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get("/api/categories/:slug/posts", async (req, res) => {
    const result = await storage.getPostsByCategory(req.params.slug);
    if (!result) return res.status(404).json({ message: "Category not found" });
    res.json(result);
  });

  app.get("/api/tags", async (_req, res) => {
    const t = await storage.getTags();
    res.json(t);
  });

  app.get("/api/tags/:slug/posts", async (req, res) => {
    const result = await storage.getPostsByTag(req.params.slug);
    if (!result) return res.status(404).json({ message: "Tag not found" });
    res.json(result);
  });

  app.get("/api/admin/posts", requireAuth, async (_req, res) => {
    const posts = await storage.getPosts(false);
    res.json(posts);
  });

  app.get("/api/admin/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPostById(parseInt(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/admin/posts", requireAuth, async (req, res) => {
    try {
      const { categoryIds = [], tagIds = [], ...postData } = req.body;
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      const parsed = insertPostSchema.parse(postData);
      const post = await storage.createPost(parsed, categoryIds, tagIds);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create post" });
    }
  });

  app.put("/api/admin/posts/:id", requireAuth, async (req, res) => {
    try {
      const { categoryIds = [], tagIds = [], ...postData } = req.body;
      if (postData.publishedAt) postData.publishedAt = new Date(postData.publishedAt);
      const parsed = insertPostSchema.partial().parse(postData);
      const post = await storage.updatePost(parseInt(req.params.id), parsed, categoryIds, tagIds);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update post" });
    }
  });

  app.delete("/api/admin/posts/:id", requireAuth, async (req, res) => {
    await storage.deletePost(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(parsed);
      res.json(cat);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertCategorySchema.partial().parse(req.body);
      const cat = await storage.updateCategory(parseInt(req.params.id), parsed);
      res.json(cat);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    await storage.deleteCategory(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.post("/api/admin/tags", requireAuth, async (req, res) => {
    try {
      const parsed = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(parsed);
      res.json(tag);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create tag" });
    }
  });

  app.put("/api/admin/tags/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertTagSchema.partial().parse(req.body);
      const tag = await storage.updateTag(parseInt(req.params.id), parsed);
      res.json(tag);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update tag" });
    }
  });

  app.delete("/api/admin/tags/:id", requireAuth, async (req, res) => {
    await storage.deleteTag(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/admin/links", requireAuth, async (_req, res) => {
    const l = await storage.getLinks();
    res.json(l);
  });

  app.post("/api/admin/links", requireAuth, async (req, res) => {
    try {
      const parsed = insertLinkSchema.parse(req.body);
      const link = await storage.createLink(parsed);
      res.json(link);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create link" });
    }
  });

  app.delete("/api/admin/links/:id", requireAuth, async (req, res) => {
    await storage.deleteLink(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const publishedPosts = await storage.getPosts(true);
    const cats = await storage.getCategories();
    const tgs = await storage.getTags();
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/blog</loc><priority>0.9</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/tools</loc><priority>0.7</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/about</loc><priority>0.5</priority></url>\n`;
    xml += `  <url><loc>${baseUrl}/contact</loc><priority>0.5</priority></url>\n`;

    for (const post of publishedPosts) {
      xml += `  <url><loc>${baseUrl}/post/${post.slug}</loc><lastmod>${new Date(post.updatedAt).toISOString().split("T")[0]}</lastmod><priority>0.8</priority></url>\n`;
    }
    for (const cat of cats) {
      xml += `  <url><loc>${baseUrl}/category/${cat.slug}</loc><priority>0.6</priority></url>\n`;
    }
    for (const tag of tgs) {
      xml += `  <url><loc>${baseUrl}/tag/${tag.slug}</loc><priority>0.5</priority></url>\n`;
    }

    xml += `</urlset>`;
    res.type("application/xml").send(xml);
  });

  app.get("/robots.txt", (_req, res) => {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";
    const txt = `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
    res.type("text/plain").send(txt);
  });

  return httpServer;
}
