import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  redirectForRole,
  verifyCredentials
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { assertCanTryLogin, clearFailedLogins, recordFailedLogin } from "@/lib/rate-limit";
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

  try {
    assertCanTryLogin(parsed.data.email);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Too many failed login attempts." },
      { status: 429 }
    );
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    recordFailedLogin(parsed.data.email);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  clearFailedLogins(parsed.data.email);
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
