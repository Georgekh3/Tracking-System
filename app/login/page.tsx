import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser, redirectForRole } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(redirectForRole(user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7] px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6">
          <div className="text-2xl font-semibold text-ink">Atelier Inventory</div>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage stock, handovers, and returns.</p>
        </div>

        <div className="panel p-6">
          <LoginForm />
        </div>

        <div className="mt-5 rounded-lg border border-atelier-line bg-white p-4 text-sm text-slate-600">
          <div className="font-medium text-ink">Demo credentials</div>
          <div className="mt-1">Admin: admin1@atelier.local / Admin123!</div>
          <div>User: user1@atelier.local / User123!</div>
        </div>
      </section>
    </main>
  );
}
