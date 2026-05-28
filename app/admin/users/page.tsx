import { Prisma, Role } from "@prisma/client";
import { Save, Search, UserCog, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { PasswordInput } from "@/components/password-input";
import { StatusMessage } from "@/components/status-message";
import { createUserAction, toggleUserStatusAction, updateUserAction } from "@/lib/actions/users";
import { requireAdmin } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  q?: string;
  success?: string;
  error?: string;
};

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";

  const where: Prisma.UserWhereInput = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">User Management</h1>
        <p className="text-sm text-slate-600">Create admins and users, update profiles, and deactivate accounts.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Create User</h2>
          <form action={createUserAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="name">Name</label>
              <input className="field-input" id="name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="email">Email</label>
              <input className="field-input" id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="role">Role</label>
              <select className="field-input" id="role" name="role" defaultValue={Role.USER}>
                <option value={Role.USER}>User</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
            <button className="btn-primary w-full" type="submit">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Create user
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <form className="panel flex flex-col gap-3 p-4 sm:flex-row" action="/admin/users">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input className="field-input pl-9" name="q" defaultValue={query} placeholder="Search by name or email" />
            </div>
            <button className="btn-secondary" type="submit">Search</button>
          </form>

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="responsive-table min-w-[860px] w-full">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="align-top">
                      <td className="table-cell font-medium text-ink" data-label="Name">{user.name}</td>
                      <td className="table-cell" data-label="Email">{user.email}</td>
                      <td className="table-cell" data-label="Role">
                        <Badge variant={user.role === Role.ADMIN ? "teal" : "neutral"}>{user.role}</Badge>
                      </td>
                      <td className="table-cell" data-label="Status">
                        <Badge variant={user.isActive ? "green" : "red"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="table-cell whitespace-nowrap" data-label="Created">{formatShortDate(user.createdAt)}</td>
                      <td className="table-cell mobile-full" data-label="Actions">
                        <div className="flex flex-col gap-2">
                          <details className="rounded-md border border-atelier-line bg-white p-2">
                            <summary className="cursor-pointer text-sm font-medium text-atelier-teal">Edit</summary>
                            <form action={updateUserAction} className="mt-3 grid gap-3">
                              <input type="hidden" name="id" value={user.id} />
                              <input className="field-input" name="name" defaultValue={user.name} required />
                              <input className="field-input" name="email" type="email" defaultValue={user.email} required />
                              <select className="field-input" name="role" defaultValue={user.role}>
                                <option value={Role.USER}>User</option>
                                <option value={Role.ADMIN}>Admin</option>
                              </select>
                              <PasswordInput
                                name="password"
                                autoComplete="new-password"
                                minLength={8}
                                placeholder="New password, optional"
                              />
                              <button className="btn-primary" type="submit">
                                <Save className="h-4 w-4" aria-hidden="true" />
                                Save
                              </button>
                            </form>
                          </details>

                          <form action={toggleUserStatusAction}>
                            <input type="hidden" name="id" value={user.id} />
                            <button className={user.isActive ? "btn-danger w-full" : "btn-secondary w-full"} type="submit">
                              <UserCog className="h-4 w-4" aria-hidden="true" />
                              {user.isActive ? "Deactivate" : "Reactivate"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 ? (
                    <tr>
                      <td className="table-cell text-center text-slate-500" colSpan={6}>No users found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
