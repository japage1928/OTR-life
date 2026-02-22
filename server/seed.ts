import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { db } from "./db";
import { users, categories, tags, posts, postCategories, postTags } from "@shared/schema";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@truckertools.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    console.warn("WARNING: Set ADMIN_EMAIL and ADMIN_PASSWORD env vars in production!");
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  await storage.createUser({ email: adminEmail, passwordHash: hash });

  const cabComfort = await storage.createCategory({ name: "Cab Comfort", slug: "cab-comfort" });
  const sleep = await storage.createCategory({ name: "Sleep", slug: "sleep" });
  const cooking = await storage.createCategory({ name: "Cooking", slug: "cooking" });
  const safety = await storage.createCategory({ name: "Safety", slug: "safety" });
  const tech = await storage.createCategory({ name: "Tech", slug: "tech" });

  const reviewTag = await storage.createTag({ name: "Review", slug: "review" });
  const tipsTag = await storage.createTag({ name: "Tips", slug: "tips" });
  const gearTag = await storage.createTag({ name: "Gear", slug: "gear" });
  const howToTag = await storage.createTag({ name: "How-To", slug: "how-to" });

  const sampleContent = `## Why Your Cab Mattress Matters

After logging 500+ miles a day, the last thing you want is a lousy night's sleep on a thin, worn-out mattress. A quality cab mattress isn't a luxury -- it's essential for staying alert and safe on the road.

### What We Tested

We spent 3 months testing the top-rated truck mattresses available in 2025:

1. **InnerSpace Luxury Truck Mattress** -- Great for budget-conscious drivers
2. **Durable Memory Foam 6.5"** -- Our top pick for comfort
3. **Truck Sleep Systems TotalRest** -- Best for hot sleepers

### Our Top Pick

The **Durable Memory Foam 6.5"** stood out for several reasons:

- CertiPUR-US certified foam
- Breathable cover that stays cool
- Fits standard 42"x80" sleeper bunks
- Easy to roll up for cleaning day

> "I've been driving OTR for 12 years and this is hands down the best sleep I've had in the cab." -- Mike R., Texas

### Quick Comparison

| Mattress | Thickness | Price | Rating |
|----------|-----------|-------|--------|
| InnerSpace | 4" | $149 | 4.2/5 |
| Durable Memory | 6.5" | $279 | 4.8/5 |
| TotalRest | 5" | $219 | 4.5/5 |

### Bottom Line

Investing in a good mattress pays for itself in better sleep, better moods, and safer driving. Don't sleep on this (pun intended).

---

*Have a mattress recommendation? Drop us a line on our [contact page](/contact)!*`;

  const post1 = await storage.createPost(
    {
      title: "Best Truck Cab Mattresses for 2025: Tested & Ranked",
      slug: "best-truck-cab-mattresses-2025",
      excerpt: "We tested the top-rated truck mattresses so you don't have to. Here are our picks for the best sleep on the road.",
      metaDescription: "Find the best truck cab mattress for 2025. We tested and ranked the top options for OTR drivers looking for comfort in the sleeper.",
      contentMd: sampleContent,
      status: "published",
      featuredImageUrl: null,
      publishedAt: new Date(),
    },
    [cabComfort.id, sleep.id],
    [reviewTag.id, gearTag.id]
  );

  const draftContent = `## Essential Cooking Gear for the Cab

Coming soon: our complete guide to cooking meals in your truck cab. We'll cover:

- Best 12V cookers and slow cookers
- Compact cookware sets
- Easy meal prep ideas
- Food storage solutions

Stay tuned!`;

  await storage.createPost(
    {
      title: "Trucker's Guide to Cooking in the Cab",
      slug: "truckers-guide-cooking-in-cab",
      excerpt: "A complete guide to cooking delicious meals right in your truck cab.",
      metaDescription: "Learn how to cook meals in your truck cab with our comprehensive guide to 12V cookers, cookware, and easy recipes.",
      contentMd: draftContent,
      status: "draft",
      featuredImageUrl: null,
      publishedAt: null,
    },
    [cooking.id],
    [tipsTag.id, howToTag.id]
  );

  const safetyContent = `## Dash Cams Every Trucker Needs

A good dash cam is your best witness on the road. Here's what to look for and our top recommendations.

### Why You Need a Dash Cam

- **Accident protection** -- Clear evidence of what happened
- **Insurance savings** -- Some insurers offer discounts
- **Fleet management** -- Keep records of your drives
- **Beautiful scenery** -- Capture those sunrise moments!

### Key Features to Look For

1. **Resolution**: At least 1080p, ideally 4K
2. **Night vision**: Essential for overnight driving
3. **GPS logging**: Track your exact location
4. **Parking mode**: Protection when you're resting
5. **Dual camera**: Front and rear coverage

### Our Recommendations

**Best Overall: Vantrue N4 Pro**
- 3-channel recording (front, inside, rear)
- 4K front camera
- Excellent night vision
- GPS and Wi-Fi built in

**Best Budget: Viofo A129 Plus**
- Solid 2K resolution
- Good value for money
- Reliable parking mode

### Installation Tips

Most dash cams can be self-installed in under 30 minutes. Here's the basic process:

1. Choose your mounting position (center top of windshield)
2. Run the power cable along the headliner
3. Connect to a USB port or hardwire kit
4. Adjust the angle and test recording

Happy driving, stay safe out there!`;

  await storage.createPost(
    {
      title: "Top Dash Cams for Truckers: 2025 Buyer's Guide",
      slug: "top-dash-cams-truckers-2025",
      excerpt: "Protect yourself on the road with the right dash cam. We break down the best options for professional drivers.",
      metaDescription: "Best dash cams for truck drivers in 2025. Compare features, prices, and our top picks for front, rear, and cabin cameras.",
      contentMd: safetyContent,
      status: "published",
      featuredImageUrl: null,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    [safety.id, tech.id],
    [reviewTag.id, gearTag.id]
  );

  console.log("Seeding complete!");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}
