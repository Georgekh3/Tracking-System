import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  redirectForRole,
  verifyCredentials
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid login details." },
      { status: 400 }
    );
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    redirectTo: redirectForRole(user.role)
  });

  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), getSessionCookieOptions());
  return response;
}
