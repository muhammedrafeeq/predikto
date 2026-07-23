import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const decoded = token ? decodeJwt(token) : null;
  const isTokenExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
  const isLoggedIn = decoded && !isTokenExpired;

  // Allow public access to home, matches, and games
  if (pathname === "/" || pathname.startsWith("/matches") || pathname.startsWith("/games")) {
    return NextResponse.next();
  }

  // /login → redirect to / if already logged in
  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Protected user routes
  const isUserRoute = pathname.startsWith("/history");

  if (isUserRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/matches/:path*",
    "/history/:path*",
    "/games/:path*",
  ],
};
