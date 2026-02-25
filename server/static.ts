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

  app.use(express.static(distPath));

  const templatePath = path.resolve(distPath, "index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  app.use("/{*path}", async (req, res) => {
    try {
      const ssr = await getSSRContent(req.path);
      if (ssr) {
        const html = injectSSR(template, ssr);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } else {
        res.sendFile(templatePath);
      }
    } catch (e) {
      console.error("SSR error:", e);
      res.sendFile(templatePath);
    }
  });
}
