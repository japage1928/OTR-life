import "dotenv/config";
import { getPool, slugify } from "./db";
import { hashPassword } from "./auth";

const defaultCategories = [
  "Bunk Comfort",
  "Gear Reviews",
  "Apps & Tools",
  "Money & Home",
  "Health OTR",
];

export async function runSeed(): Promise<void> {
  const db = getPool();

  const userResult = await db.query("SELECT COUNT(*) AS c FROM users");
  const userCount = Number(userResult.rows[0]?.c ?? 0);

  if (userCount === 0) {
    const adminUser = (process.env.ADMIN_USER || "admin").trim();
    const adminPass = (process.env.ADMIN_PASS || "changeme123").trim();

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
      console.warn("[seed] ADMIN_USER/ADMIN_PASS not set, using temporary defaults.");
    }

    const passwordHash = hashPassword(adminPass);
    await db.query("INSERT INTO users (username, password_hash) VALUES ($1, $2)", [adminUser, passwordHash]);
    console.log(`[seed] Admin user created: ${adminUser}`);
  }

  for (const name of defaultCategories) {
    const slug = slugify(name);
    await db.query("INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING", [name, slug]);
  }
  console.log("[seed] Default categories ensured.");
}

if (require.main === module) {
  runSeed().then(() => {
    console.log("[seed] Complete.");
    process.exit(0);
  }).catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  });
}
