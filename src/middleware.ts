import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";

const PAYMENT_ROUTES = ["/api/checkout", "/api/subscription"];

function isPaymentRoute(pathname: string): boolean {
  return PAYMENT_ROUTES.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  if (!isPaymentRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const result = rateLimiter.check(ip);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  const response = NextResponse.next();

  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));

  return response;
}

export const config = {
  matcher: ["/api/checkout/:path*", "/api/subscription/:path*"],
};
