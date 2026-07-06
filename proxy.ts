import { NextResponse, type NextRequest } from "next/server";

const REDIRECT_HOSTS = new Set(["hamo.life", "www.hamo.life"]);
const REDIRECT_TARGET = "https://hamocare.com";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];

  if (host && REDIRECT_HOSTS.has(host)) {
    return NextResponse.redirect(REDIRECT_TARGET, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
