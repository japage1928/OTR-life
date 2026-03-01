import "dotenv/config";
import { getDb, slugify } from "./db";
import { hashPassword } from "./auth";

const defaultCategories = [
  "Bunk Comfort",
  "Gear Reviews",
  "Apps & Tools",
  "Money & Home",
  "Health OTR",
];

export function runSeed() {
  const db = getDb();
  const userCount = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number })?.c ?? 0;

  if (userCount === 0) {
    const adminUser = (process.env.ADMIN_USER || "admin").trim();
    const adminPass = (process.env.ADMIN_PASS || "changeme123").trim();

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
      console.warn("[seed] ADMIN_USER/ADMIN_PASS not set, using temporary defaults.");
    }

    const passwordHash = hashPassword(adminPass);
    db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(adminUser, passwordHash);
    console.log(`[seed] Admin user created: ${adminUser}`);
  }

  for (const name of defaultCategories) {
    const slug = slugify(name);
    db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
  }
  console.log("[seed] Default categories ensured.");
}

if (require.main === module) {
  runSeed();
  console.log("[seed] Complete.");
  process.exit(0);
}