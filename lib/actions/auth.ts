"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, redirectForRole, setSessionCookie, verifyCredentials } from "@/lib/auth";
import { assertCanTryLogin, clearFailedLogins, recordFailedLogin } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login details." };
  }

  try {
    assertCanTryLogin(parsed.data.email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Too many failed login attempts." };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    recordFailedLogin(parsed.data.email);
    return { error: "Invalid email or password." };
  }

  clearFailedLogins(parsed.data.email);
  await setSessionCookie(user);
  redirect(redirectForRole(user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
