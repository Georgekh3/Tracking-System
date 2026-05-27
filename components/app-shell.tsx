import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Boxes,
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Users
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/items", label: "Inventory", icon: Boxes },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/give", label: "Give Items", icon: HandCoins },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList }
];

const userLinks = [{ href: "/dashboard", label: "My Items", icon: LayoutDashboard }];

export function AppShell({
  user,
  children
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const links = user.role === Role.ADMIN ? adminLinks : userLinks;

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <header className="border-b border-atelier-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={user.role === Role.ADMIN ? "/admin" : "/dashboard"} className="min-w-0">
              <div className="text-lg font-semibold text-ink">Atelier Inventory</div>
              <div className="text-sm text-slate-500">Item tracking and stock control</div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-ink">{user.name}</div>
                <div className="text-xs uppercase text-slate-500">{user.role.toLowerCase()}</div>
              </div>
              <form action={logoutAction}>
                <button className="btn-secondary" type="submit" title="Log out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-atelier-line bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-atelier-mist"
                >
                  <Icon className="h-4 w-4 text-atelier-teal" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
