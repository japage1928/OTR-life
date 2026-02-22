import {
  type User, type InsertUser,
  type Post, type InsertPost, type PostWithRelations,
  type Category, type InsertCategory,
  type Tag, type InsertTag,
  type Link, type InsertLink,
  users, posts, categories, tags, postCategories, postTags, links,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getPosts(onlyPublished?: boolean): Promise<PostWithRelations[]>;
  getPostBySlug(slug: string): Promise<PostWithRelations | undefined>;
  getPostById(id: number): Promise<(Post & { categoryIds: number[]; tagIds: number[] }) | undefined>;
  createPost(post: InsertPost, categoryIds: number[], tagIds: number[]): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>, categoryIds: number[], tagIds: number[]): Promise<Post>;
  deletePost(id: number): Promise<void>;
  searchPosts(query: string): Promise<PostWithRelations[]>;
  getPostsByCategory(categorySlug: string): Promise<{ category: Category; posts: PostWithRelations[] } | undefined>;
  getPostsByTag(tagSlug: string): Promise<{ tag: Tag; posts: PostWithRelations[] } | undefined>;

  getCategories(): Promise<Category[]>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag>;
  deleteTag(id: number): Promise<void>;

  getLinks(): Promise<Link[]>;
  createLink(link: InsertLink): Promise<Link>;
  deleteLink(id: number): Promise<void>;
}

async function enrichPostsWithRelations(rawPosts: Post[]): Promise<PostWithRelations[]> {
  if (rawPosts.length === 0) return [];
  const postIds = rawPosts.map((p) => p.id);

  const pc = await db.select().from(postCategories).where(inArray(postCategories.postId, postIds));
  const pt = await db.select().from(postTags).where(inArray(postTags.postId, postIds));

  const catIds = [...new Set(pc.map((r) => r.categoryId))];
  const tagIds = [...new Set(pt.map((r) => r.tagId))];

  const cats = catIds.length > 0 ? await db.select().from(categories).where(inArray(categories.id, catIds)) : [];
  const tgs = tagIds.length > 0 ? await db.select().from(tags).where(inArray(tags.id, tagIds)) : [];

  const catMap = new Map(cats.map((c) => [c.id, c]));
  const tagMap = new Map(tgs.map((t) => [t.id, t]));

  return rawPosts.map((post) => ({
    ...post,
    categories: pc.filter((r) => r.postId === post.id).map((r) => catMap.get(r.categoryId)!).filter(Boolean),
    tags: pt.filter((r) => r.postId === post.id).map((r) => tagMap.get(r.tagId)!).filter(Boolean),
  }));
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPosts(onlyPublished = true): Promise<PostWithRelations[]> {
    let query;
    if (onlyPublished) {
      query = await db.select().from(posts).where(eq(posts.status, "published")).orderBy(desc(posts.publishedAt));
    } else {
      query = await db.select().from(posts).orderBy(desc(posts.updatedAt));
    }
    return enrichPostsWithRelations(query);
  }

  async getPostBySlug(slug: string): Promise<PostWithRelations | undefined> {
    const [post] = await db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.status, "published")));
    if (!post) return undefined;
    const enriched = await enrichPostsWithRelations([post]);
    return enriched[0];
  }

  async getPostById(id: number): Promise<(Post & { categoryIds: number[]; tagIds: number[] }) | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;
    const pc = await db.select().from(postCategories).where(eq(postCategories.postId, id));
    const pt = await db.select().from(postTags).where(eq(postTags.postId, id));
    return { ...post, categoryIds: pc.map((r) => r.categoryId), tagIds: pt.map((r) => r.tagId) };
  }

  async createPost(insertPost: InsertPost, categoryIds: number[], tagIds: number[]): Promise<Post> {
    const [post] = await db.insert(posts).values({
      ...insertPost,
      updatedAt: new Date(),
    }).returning();

    if (categoryIds.length > 0) {
      await db.insert(postCategories).values(categoryIds.map((cid) => ({ postId: post.id, categoryId: cid })));
    }
    if (tagIds.length > 0) {
      await db.insert(postTags).values(tagIds.map((tid) => ({ postId: post.id, tagId: tid })));
    }
    return post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>, categoryIds: number[], tagIds: number[]): Promise<Post> {
    const [post] = await db.update(posts).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(posts.id, id)).returning();

    await db.delete(postCategories).where(eq(postCategories.postId, id));
    await db.delete(postTags).where(eq(postTags.postId, id));

    if (categoryIds.length > 0) {
      await db.insert(postCategories).values(categoryIds.map((cid) => ({ postId: id, categoryId: cid })));
    }
    if (tagIds.length > 0) {
      await db.insert(postTags).values(tagIds.map((tid) => ({ postId: id, tagId: tid })));
    }
    return post;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async searchPosts(query: string): Promise<PostWithRelations[]> {
    const pattern = `%${query}%`;
    const results = await db.select().from(posts).where(
      and(
        eq(posts.status, "published"),
        or(
          ilike(posts.title, pattern),
          ilike(posts.contentMd, pattern),
          ilike(posts.excerpt, pattern),
        ),
      )
    ).orderBy(desc(posts.publishedAt));
    return enrichPostsWithRelations(results);
  }

  async getPostsByCategory(categorySlug: string): Promise<{ category: Category; posts: PostWithRelations[] } | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, categorySlug));
    if (!cat) return undefined;
    const pc = await db.select().from(postCategories).where(eq(postCategories.categoryId, cat.id));
    if (pc.length === 0) return { category: cat, posts: [] };
    const postIds = pc.map((r) => r.postId);
    const matchedPosts = await db.select().from(posts).where(
      and(inArray(posts.id, postIds), eq(posts.status, "published"))
    ).orderBy(desc(posts.publishedAt));
    const enriched = await enrichPostsWithRelations(matchedPosts);
    return { category: cat, posts: enriched };
  }

  async getPostsByTag(tagSlug: string): Promise<{ tag: Tag; posts: PostWithRelations[] } | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
    if (!tag) return undefined;
    const pt = await db.select().from(postTags).where(eq(postTags.tagId, tag.id));
    if (pt.length === 0) return { tag, posts: [] };
    const postIds = pt.map((r) => r.postId);
    const matchedPosts = await db.select().from(posts).where(
      and(inArray(posts.id, postIds), eq(posts.status, "published"))
    ).orderBy(desc(posts.publishedAt));
    const enriched = await enrichPostsWithRelations(matchedPosts);
    return { tag, posts: enriched };
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(cat: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(cat).returning();
    return result;
  }

  async updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db.update(categories).set(cat).where(eq(categories.id, id)).returning();
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [result] = await db.insert(tags).values(tag).returning();
    return result;
  }

  async updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag> {
    const [result] = await db.update(tags).set(tag).where(eq(tags.id, id)).returning();
    return result;
  }

  async deleteTag(id: number): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }

  async getLinks(): Promise<Link[]> {
    return db.select().from(links).orderBy(desc(links.createdAt));
  }

  async createLink(link: InsertLink): Promise<Link> {
    const [result] = await db.insert(links).values(link).returning();
    return result;
  }

  async deleteLink(id: number): Promise<void> {
    await db.delete(links).where(eq(links.id, id));
  }
}

export const storage = new DatabaseStorage();
