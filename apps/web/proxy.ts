import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;

  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  // Admin area
  if (path.startsWith("/admin")) {
    if (!isAuthed) return redirectToLogin(req.url, path);
    if (!isAdmin) return NextResponse.redirect(new URL("/", req.url));
  }

  // Authenticated-only areas — cart görüntülemek için login gerekmiyor
  // (localStorage); sadece checkout ve account korunur.
  const authedAreas = ["/account", "/checkout"];
  if (authedAreas.some((p) => path.startsWith(p))) {
    if (!isAuthed) return redirectToLogin(req.url, path);
  }

  return NextResponse.next();
});

function redirectToLogin(currentUrl: string, returnTo: string) {
  const url = new URL("/login", currentUrl);
  url.searchParams.set("from", returnTo);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
