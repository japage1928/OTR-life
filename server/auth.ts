import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { getPool } from "./db";

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

export async function getAdminByUsername(username: string): Promise<{ id: number; username: string; password_hash: string } | undefined> {
  const result = await getPool().query(
    "SELECT id, username, password_hash FROM users WHERE username = $1 LIMIT 1",
    [username],
  );
  return result.rows[0];
}

export async function getAdminById(id: number): Promise<{ id: number; username: string; password_hash: string } | undefined> {
  const result = await getPool().query(
    "SELECT id, username, password_hash FROM users WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0];
}
