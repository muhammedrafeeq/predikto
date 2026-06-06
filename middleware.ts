import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight JWT decoder that works in Next.js Edge Runtime
function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // decode base64 using atob (native in Edge runtime)
    const raw = atob(base64);
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const decoded = token ? decodeJwt(token) : null;
  const isTokenExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
  const isLoggedIn = decoded && !isTokenExpired;

  // 0. Root "/" — always redirect to contests (auth check there handles unauthenticated)
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/contests", request.url));
  }

  // 1. If trying to access /login and already logged in, redirect to contests
  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/contests", request.url));
    }
    return NextResponse.next();
  }

  // Redirect legacy pages directly to contests if logged in
  if (isLoggedIn && (pathname === "/matches" || pathname === "/leaderboard")) {
    return NextResponse.redirect(new URL("/contests", request.url));
  }

  // 2. If trying to access protected user routes but not logged in, redirect to login
  const isUserRoute =
    pathname.startsWith("/contests") ||
    pathname.startsWith("/matches") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/games");

  if (isUserRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. If trying to access admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decoded.role !== "admin") {
      // Redirect unauthorized users back to contests
      return NextResponse.redirect(new URL("/contests", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/contests/:path*",
    "/matches/:path*",
    "/leaderboard/:path*",
    "/history/:path*",
    "/admin/:path*",
    "/games/:path*",
  ],
};
