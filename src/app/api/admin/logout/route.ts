import { clearAdminCookies } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export const runtime = "nodejs";

export async function POST() {
  const response = jsonResponse({ ok: true });
  clearAdminCookies(response);
  return response;
}
