import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { getDb } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.redirect("/admin/login");
  }
  return next();
}

export function getAdminByUsername(username: string) {
  const db = getDb();
  return db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1")
    .get(username) as { id: number; username: string; password_hash: string } | undefined;
}

export function getAdminById(id: number) {
  const db = getDb();
  return db
    .prepare("SELECT id, username, password_hash FROM users WHERE id = ? LIMIT 1")
    .get(id) as { id: number; username: string; password_hash: string } | undefined;
}
