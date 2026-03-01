import "dotenv/config";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import helmet from "helmet";
import expressLayouts from "express-ejs-layouts";
import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";
import { runSeed } from "./seed";

const app = express();
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.set("layout", "layouts/public");

app.locals.siteName = "OTR Life";
app.locals.formatDate = (input: string | Date) => {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

app.use(expressLayouts);
app.use(express.static(path.join(process.cwd(), "public")));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use("/admin", adminRoutes);
app.use("/", publicRoutes);

app.use((req, res) => {
  res.status(404).render("public/404", {
    pageTitle: "Page Not Found | Trucking Blog Tools",
    metaDescription: "This page does not exist.",
  });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  const layout = req.path.startsWith("/admin") ? "layouts/admin" : "layouts/public";

  res.status(status).render("public/500", {
    layout,
    pageTitle: "Server Error | Trucking Blog Tools",
    metaDescription: "Something went wrong.",
  });
});

async function start() {
  runSeed();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Trucking Blog Tools listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
