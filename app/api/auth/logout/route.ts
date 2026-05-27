import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0
  });
  return response;
}
