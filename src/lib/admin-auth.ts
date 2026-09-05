import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonResponse } from "@/lib/json";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const ADMIN_ACCESS_COOKIE = "tsb_admin_access";
export const ADMIN_REFRESH_COOKIE = "tsb_admin_refresh";

function secureCookieEnabled() {
  return process.env.NODE_ENV === "production" || process.env.NETLIFY === "true";
}

export function setAdminCookies(response: NextResponse, accessToken: string, refreshToken: string, maxAge: number) {
  const secure = secureCookieEnabled();

  response.cookies.set(ADMIN_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge
  });

  response.cookies.set(ADMIN_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAdminCookies(response: NextResponse) {
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: secureCookieEnabled(),
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });

  response.cookies.set(ADMIN_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: secureCookieEnabled(),
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
}

export async function getAdminUser() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  const allowedEmail = process.env.ADMIN_ALLOWED_EMAIL?.trim().toLowerCase();
  if (allowedEmail && data.user.email?.toLowerCase() !== allowedEmail) return null;

  return data.user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    return {
      user: null,
      response: jsonResponse({ error: "Não autorizado" }, { status: 401 })
    };
  }

  return { user, response: null };
}
