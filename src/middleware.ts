import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Initialize response
  const response = NextResponse.next();

  // --------------------------------------------------------------------------
  // 1. Enterprise Security Headers (OWASP Recommended)
  // --------------------------------------------------------------------------
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // --------------------------------------------------------------------------
  // 2. Server-side Route Protection for Dashboards
  // --------------------------------------------------------------------------
  const isProtectedPath =
    pathname.startsWith("/customer") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff");

  if (isProtectedPath) {
    // Check if Supabase session token cookie or demo session cookie exists
    const hasSbToken = request.cookies
      .getAll()
      .some(
        (c) =>
          c.name.startsWith("sb-") &&
          (c.name.endsWith("-auth-token") || c.name.includes("auth"))
      );

    // Note: In client-side demo mode, localStorage is used, so client-side
    // DashboardShell handles the redirect if no demo user exists.
    // If you want strict server enforcement with Supabase:
    // if (!hasSbToken && !isDemo) redirect to /login
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, logos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
