import { getAdminUser } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return jsonResponse({ authenticated: false }, { status: 401 });

  return jsonResponse({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email
    }
  });
}
