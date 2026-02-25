import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { getSSRContent, injectSSR } from "./ssr";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const templatePath = path.resolve(distPath, "index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  const ssrHandler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const ssr = await getSSRContent(req.path);
      if (ssr) {
        const html = injectSSR(template, ssr);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } else {
        next();
      }
    } catch (e) {
      console.error("SSR error:", e);
      next();
    }
  };

  app.get("/", ssrHandler);
  app.get("/blog", ssrHandler);
  app.get("/post/:slug", ssrHandler);
  app.get("/category/:slug", ssrHandler);
  app.get("/tag/:slug", ssrHandler);
  app.get("/about", ssrHandler);
  app.get("/contact", ssrHandler);
  app.get("/tools", ssrHandler);
  app.get("/privacy", ssrHandler);
  app.get("/affiliate-disclosure", ssrHandler);
  app.get("/search", ssrHandler);

  app.use(express.static(distPath));

  app.use("/{*path}", (_req, res) => {
    res.sendFile(templatePath);
  });
}
