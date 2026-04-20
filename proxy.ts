import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

const protectedPaths = ["/dashboard", "/connect-gmail", "/generate"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/connect-gmail/:path*", "/generate/:path*"],
};
