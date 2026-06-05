import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: number;
  name: string;
  role: string;
}

export async function requireAuth(): Promise<AuthUser> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw Object.assign(new Error("Server misconfigured"), { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw Object.assign(new Error("Not authenticated"), { status: 401 });

  try {
    const decoded = jwt.verify(token, secret) as AuthUser & { userId: number };
    return { userId: decoded.userId, name: decoded.name, role: decoded.role };
  } catch {
    throw Object.assign(new Error("Invalid token"), { status: 401 });
  }
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw Object.assign(new Error("Forbidden"), { status: 403 });
  return user;
}
