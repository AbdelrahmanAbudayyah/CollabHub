import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — runs on the server for every matched request
 * BEFORE the page renders.
 *
 * Previously, this checked for a "refreshToken" cookie and redirected
 * to /login if it was missing. But that doesn't work because:
 *   - The refreshToken cookie is set by the backend at localhost:8080
 *   - When the browser navigates to localhost:3000/profile, it only
 *     sends cookies belonging to localhost:3000
 *   - The middleware runs on the Next.js server and can't see
 *     cross-origin cookies from localhost:8080
 *
 * Auth protection is handled client-side by <ProtectedRoute>, which:
 *   1. Calls POST /auth/refresh (Axios sends the cookie cross-origin)
 *   2. Shows a loading spinner while checking
 *   3. Redirects to /login if not authenticated
 *
 * This middleware is kept as a pass-through in case we need to add
 * server-side logic later (e.g. same-origin cookie after BFF setup).
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/projects/create"],
};
