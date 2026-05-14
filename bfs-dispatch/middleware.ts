import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ROLE_PERMISSIONS, type RoleType } from "@/config/roles";

const protectedPaths = [
  "/dashboard",
  "/loads",
  "/carriers",
  "/drivers",
  "/reports",
  "/brokers",
  "/traceability",
];

const roleRestrictedPaths: Record<string, string> = {
  "/dashboard/human-resources": "human_resources",
};

function getRouteModule(pathname: string): string | null {
  for (const [path, module] of Object.entries(roleRestrictedPaths)) {
    if (pathname.startsWith(path)) return module;
  }
  return null;
}

function hasModuleAccess(role: RoleType, module: string): boolean {
  const config = ROLE_PERMISSIONS[role];
  if (!config) return false;
  if (config.modules.includes("*")) return true;
  return config.modules.includes(module);
}

async function getUserRoleFromDB(
  supabase: ReturnType<typeof createServerClient>
): Promise<RoleType | null> {
  const { data, error } = await supabase.rpc("get_user_role_type");
  if (error || !data) return null;
  return data as RoleType;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  if (!protectedPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const dbRole = await getUserRoleFromDB(supabase);
  if (!dbRole) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "No role assigned");
    return NextResponse.redirect(redirectUrl);
  }

  const restrictedModule = getRouteModule(pathname);
  if (restrictedModule && !hasModuleAccess(dbRole, restrictedModule)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.set("denied", "1");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/loads/:path*",
    "/carriers/:path*",
    "/drivers/:path*",
    "/reports/:path*",
    "/brokers/:path*",
    "/traceability/:path*",
  ],
};
