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

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const decoded = token ? decodeJwt(token) : null;
  const isTokenExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
  const isLoggedIn = decoded && !isTokenExpired;

  // "/" is the home/contests page — always serve it (public)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // /contests (exact) → redirect to /
  if (pathname === "/contests") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /login → redirect to / if already logged in
  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Legacy redirects
  if (isLoggedIn && (pathname === "/matches" || pathname === "/leaderboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protected user routes (sub-routes only — base paths excluded)
  const isUserRoute =
    pathname.startsWith("/contests/") ||
    pathname.startsWith("/matches/") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/games/") ||
    pathname.startsWith("/collection") ||
    pathname.startsWith("/trades") ||
    pathname.startsWith("/onboarding/");

  if (isUserRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", request.url));
    if (decoded.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/contests",
    "/contests/:path+",
    "/matches/:path*",
    "/leaderboard/:path*",
    "/history/:path*",
    "/admin/:path*",
    "/games/:path*",
    "/collection/:path*",
    "/trades/:path*",
    "/onboarding/:path*",
  ],
};
