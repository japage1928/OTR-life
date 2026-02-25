import { storage } from "./storage";
import { marked } from "marked";
import type { PostWithRelations, Category, Tag } from "@shared/schema";

marked.setOptions({ async: false });

const SITE_NAME = "TruckerTools";

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*\S+/gi, "");
}

function safeJsonLd(obj: object): string {
  return JSON.stringify(obj).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
}

function getBaseUrl(): string {
  return process.env.SITE_URL || "https://trucking-blog-tools.replit.app";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).replace(/\s+\S*$/, "") + "...";
}

function formatDateISO(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

function buildHead(meta: {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: object;
}): string {
  const lines: string[] = [];
  lines.push(`<title>${escapeHtml(meta.title)}</title>`);
  lines.push(`<meta name="description" content="${escapeHtml(meta.description)}" />`);
  lines.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  lines.push(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
  lines.push(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  lines.push(`<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`);
  lines.push(`<meta property="og:type" content="${meta.ogType || "website"}" />`);
  lines.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  if (meta.ogImage) {
    lines.push(`<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`);
  }
  if (meta.publishedTime) {
    lines.push(`<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`);
  }
  if (meta.modifiedTime) {
    lines.push(`<meta property="article:modified_time" content="${escapeHtml(meta.modifiedTime)}" />`);
  }
  lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
  lines.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  lines.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);
  if (meta.jsonLd) {
    lines.push(`<script type="application/ld+json">${safeJsonLd(meta.jsonLd)}</script>`);
  }
  return lines.join("\n    ");
}

function renderPostCard(post: PostWithRelations, baseUrl: string): string {
  const href = `/post/${post.slug}`;
  const date = post.publishedAt ? formatDateISO(post.publishedAt) : "";
  const excerpt = escapeHtml(post.excerpt || truncate(post.contentMd.replace(/[#*_`\[\]]/g, ""), 160));
  const cats = post.categories.map(c => `<span>${escapeHtml(c.name)}</span>`).join(" ");
  return `<article>
      <a href="${href}" data-testid="link-post-${post.id}">
        ${post.featuredImageUrl ? `<img src="${escapeHtml(post.featuredImageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />` : ""}
        <h3>${escapeHtml(post.title)}</h3>
        ${date ? `<time datetime="${date}">${date}</time>` : ""}
        <p>${excerpt}</p>
        ${cats ? `<div>${cats}</div>` : ""}
      </a>
    </article>`;
}

async function renderHomePage(baseUrl: string): Promise<{ head: string; body: string }> {
  const [posts, categories] = await Promise.all([
    storage.getPosts(true),
    storage.getCategories(),
  ]);

  const head = buildHead({
    title: `${SITE_NAME} - Your Trucking Companion for Better Rides`,
    description: "Tips, reviews, and tools to make every mile more comfortable, safe, and profitable. Gear reviews, cab comfort guides, and free trucker tools.",
    canonical: baseUrl + "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: baseUrl,
      description: "Tips, reviews, and tools to make every mile more comfortable, safe, and profitable.",
    },
  });

  const postCards = posts.slice(0, 6).map(p => renderPostCard(p, baseUrl)).join("\n");
  const catLinks = categories.map(c =>
    `<a href="/category/${c.slug}">${escapeHtml(c.name)}</a>`
  ).join(" ");

  const body = `<div>
    <h1>Your Trucking Companion for Better Rides</h1>
    <p>Tips, reviews, and tools to make every mile more comfortable, safe, and profitable.</p>
    <section>
      <h2>Latest Posts</h2>
      ${postCards}
      <a href="/blog">View All Posts</a>
    </section>
    ${categories.length > 0 ? `<section><h2>Categories</h2><nav>${catLinks}</nav></section>` : ""}
    <section>
      <h2>Trucker Tools</h2>
      <p>Free calculators, converters, and tools designed for life on the road.</p>
      <a href="/tools">Explore Tools</a>
    </section>
  </div>`;

  return { head, body };
}

async function renderBlogPage(baseUrl: string): Promise<{ head: string; body: string }> {
  const posts = await storage.getPosts(true);

  const head = buildHead({
    title: `Blog - ${SITE_NAME}`,
    description: "All articles about trucking life, gear reviews, cab comfort tips, and more.",
    canonical: baseUrl + "/blog",
  });

  const postCards = posts.map(p => renderPostCard(p, baseUrl)).join("\n");

  const body = `<div>
    <h1>Blog</h1>
    <section>${postCards}</section>
  </div>`;

  return { head, body };
}

async function renderPostPage(slug: string, baseUrl: string): Promise<{ head: string; body: string } | null> {
  const post = await storage.getPostBySlug(slug);
  if (!post) return null;

  const contentHtml = sanitizeHtml(await marked.parse(post.contentMd));
  const description = post.metaDescription || post.excerpt || truncate(post.contentMd.replace(/[#*_`\[\]]/g, ""), 160);

  const head = buildHead({
    title: `${post.title} - ${SITE_NAME}`,
    description,
    canonical: `${baseUrl}/post/${post.slug}`,
    ogType: "article",
    ogImage: post.featuredImageUrl || undefined,
    publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      url: `${baseUrl}/post/${post.slug}`,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      image: post.featuredImageUrl || undefined,
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
  });

  const catLinks = post.categories.map(c =>
    `<a href="/category/${c.slug}">${escapeHtml(c.name)}</a>`
  ).join(" ");
  const tagLinks = post.tags.map(t =>
    `<a href="/tag/${t.slug}">${escapeHtml(t.name)}</a>`
  ).join(" ");

  const body = `<article>
    <a href="/blog">Back to Blog</a>
    ${catLinks ? `<nav>${catLinks}</nav>` : ""}
    <h1>${escapeHtml(post.title)}</h1>
    ${post.publishedAt ? `<time datetime="${formatDateISO(post.publishedAt)}">${formatDateISO(post.publishedAt)}</time>` : ""}
    ${post.featuredImageUrl ? `<img src="${escapeHtml(post.featuredImageUrl)}" alt="${escapeHtml(post.title)}" />` : ""}
    <div>${contentHtml}</div>
    ${tagLinks ? `<nav>Tags: ${tagLinks}</nav>` : ""}
  </article>`;

  return { head, body };
}

async function renderCategoryPage(slug: string, baseUrl: string): Promise<{ head: string; body: string } | null> {
  const result = await storage.getPostsByCategory(slug);
  if (!result) return null;

  const { category, posts } = result;

  const head = buildHead({
    title: `${category.name} - ${SITE_NAME}`,
    description: `Browse all ${category.name} articles on ${SITE_NAME}.`,
    canonical: `${baseUrl}/category/${category.slug}`,
  });

  const postCards = posts.map(p => renderPostCard(p, baseUrl)).join("\n");

  const body = `<div>
    <h1>${escapeHtml(category.name)}</h1>
    <section>${postCards}</section>
  </div>`;

  return { head, body };
}

async function renderTagPage(slug: string, baseUrl: string): Promise<{ head: string; body: string } | null> {
  const result = await storage.getPostsByTag(slug);
  if (!result) return null;

  const { tag, posts } = result;

  const head = buildHead({
    title: `${tag.name} - ${SITE_NAME}`,
    description: `Browse all articles tagged "${tag.name}" on ${SITE_NAME}.`,
    canonical: `${baseUrl}/tag/${tag.slug}`,
  });

  const postCards = posts.map(p => renderPostCard(p, baseUrl)).join("\n");

  const body = `<div>
    <h1>${escapeHtml(tag.name)}</h1>
    <section>${postCards}</section>
  </div>`;

  return { head, body };
}

function renderStaticPage(title: string, description: string, path: string, bodyHtml: string, baseUrl: string): { head: string; body: string } {
  const head = buildHead({
    title: `${title} - ${SITE_NAME}`,
    description,
    canonical: `${baseUrl}${path}`,
  });
  return { head, body: bodyHtml };
}

export async function getSSRContent(url: string): Promise<{ head: string; body: string } | null> {
  const baseUrl = getBaseUrl();

  if (url === "/" || url === "") {
    return renderHomePage(baseUrl);
  }

  if (url === "/blog") {
    return renderBlogPage(baseUrl);
  }

  const postMatch = url.match(/^\/post\/([^/?#]+)/);
  if (postMatch) {
    return renderPostPage(postMatch[1], baseUrl);
  }

  const catMatch = url.match(/^\/category\/([^/?#]+)/);
  if (catMatch) {
    return renderCategoryPage(catMatch[1], baseUrl);
  }

  const tagMatch = url.match(/^\/tag\/([^/?#]+)/);
  if (tagMatch) {
    return renderTagPage(tagMatch[1], baseUrl);
  }

  if (url === "/about") {
    return renderStaticPage(
      "About",
      "Learn about TruckerTools and our mission to help truck drivers.",
      "/about",
      `<div><h1>About TruckerTools</h1><p>Your trucking companion for better rides.</p></div>`,
      baseUrl
    );
  }

  if (url === "/contact") {
    return renderStaticPage(
      "Contact",
      "Get in touch with the TruckerTools team.",
      "/contact",
      `<div><h1>Contact Us</h1><p>We'd love to hear from you.</p></div>`,
      baseUrl
    );
  }

  if (url === "/tools") {
    return renderStaticPage(
      "Trucker Tools",
      "Free calculators, converters, and tools designed for life on the road.",
      "/tools",
      `<div><h1>Trucker Tools</h1><p>Free calculators, converters, and tools designed for life on the road.</p><a href="/tools/route-log-converter">Route Log Converter</a></div>`,
      baseUrl
    );
  }

  if (url === "/privacy") {
    return renderStaticPage(
      "Privacy Policy",
      "Privacy policy for TruckerTools.",
      "/privacy",
      `<div><h1>Privacy Policy</h1></div>`,
      baseUrl
    );
  }

  if (url === "/affiliate-disclosure") {
    return renderStaticPage(
      "Affiliate Disclosure",
      "Affiliate disclosure for TruckerTools.",
      "/affiliate-disclosure",
      `<div><h1>Affiliate Disclosure</h1></div>`,
      baseUrl
    );
  }

  if (url === "/search") {
    return renderStaticPage(
      "Search",
      "Search articles on TruckerTools.",
      "/search",
      `<div><h1>Search</h1></div>`,
      baseUrl
    );
  }

  return null;
}

export function injectSSR(template: string, ssr: { head: string; body: string }): string {
  let result = template.replace("</head>", `    ${ssr.head}\n  </head>`);
  result = result.replace('<div id="root"></div>', `<div id="root">${ssr.body}</div>`);
  return result;
}
