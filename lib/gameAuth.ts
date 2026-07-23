import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface AuthUser {
  userId: number;
  name: string;
  role: string;
}

export async function getOptionalAuth(): Promise<AuthUser | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, secret) as AuthUser & { userId: number };
    return { userId: decoded.userId, name: decoded.name, role: decoded.role };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getOptionalAuth();
  if (!user) throw Object.assign(new Error("Not authenticated"), { status: 401 });
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw Object.assign(new Error("Forbidden"), { status: 403 });
  return user;
}
