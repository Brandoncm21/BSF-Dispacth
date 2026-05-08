import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const protectedPaths = ["/dashboard", "/loads", "/carriers", "/drivers", "/reports"];

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  if (!protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
    },
  });

  const cookieHeader = request.headers.get("cookie") || "";
  const supabaseCookies = cookieHeader
    .split(";")
    .reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/loads/:path*", "/carriers/:path*", "/drivers/:path*", "/reports/:path*"],
};
