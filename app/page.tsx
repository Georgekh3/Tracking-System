import { redirect } from "next/navigation";
import { getCurrentUser, redirectForRole } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? redirectForRole(user.role) : "/login");
}
