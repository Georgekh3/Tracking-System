"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, redirectForRole, setSessionCookie, verifyCredentials } from "@/lib/auth";
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

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie(user);
  redirect(redirectForRole(user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
