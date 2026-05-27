import { Role } from "@prisma/client";
import { HandCoins, PackageCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatusMessage } from "@/components/status-message";
import { giveItemAction } from "@/lib/actions/transactions";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, toNumber } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function GiveItemsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};

  const [users, items, holdings] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.USER, isActive: true },
      orderBy: { name: "asc" }
    }),
    prisma.item.findMany({
      where: { isDeleted: false, quantity: { gt: 0 } },
      orderBy: { name: "asc" }
    }),
    getHoldings({ onlyRemaining: true })
  ]);

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Give Items to Users</h1>
        <p className="text-sm text-slate-600">Hand over stock, record notes, and prevent quantities above current Atelier stock.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">New Handover</h2>
          <form action={giveItemAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="userId">User</label>
              <select className="field-input" id="userId" name="userId" required>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} · {user.email}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="itemId">Item</label>
              <select className="field-input" id="itemId" name="itemId" required>
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.quantity} in stock · {formatCurrency(toNumber(item.unitPrice))}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="quantity">Quantity given</label>
              <input className="field-input" id="quantity" name="quantity" type="number" min="1" step="1" required />
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="notes">Notes</label>
              <textarea className="field-input min-h-24" id="notes" name="notes" />
            </div>

            <button className="btn-primary w-full" type="submit">
              <HandCoins className="h-4 w-4" aria-hidden="true" />
              Give items
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="panel overflow-hidden">
            <div className="border-b border-atelier-line p-5">
              <h2 className="text-lg font-semibold text-ink">Available Atelier Stock</h2>
              <p className="text-sm text-slate-500">Stock remaining is updated after each handover.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-md border border-atelier-line p-3">
                  <ItemPhoto imagePath={item.imagePath} name={item.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{item.name}</div>
                    <div className="text-xs text-slate-500">{formatCurrency(toNumber(item.unitPrice))} each</div>
                  </div>
                  <Badge variant="green">{item.quantity} left</Badge>
                </div>
              ))}
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed border-atelier-line p-4 text-sm text-slate-500">
                  No stock is currently available to hand over.
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-atelier-line p-5">
              <h2 className="text-lg font-semibold text-ink">Current Items With Users</h2>
              <p className="text-sm text-slate-500">Total value given is based on remaining quantity and current item price.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.key}>
                      <td className="table-cell font-medium text-ink">{holding.userName}</td>
                      <td className="table-cell">{holding.itemName}</td>
                      <td className="table-cell">{holding.givenQuantity}</td>
                      <td className="table-cell">
                        <Badge variant="teal">{holding.remainingQuantity}</Badge>
                      </td>
                      <td className="table-cell">{formatCurrency(holding.currentValue)}</td>
                    </tr>
                  ))}
                  {holdings.length === 0 ? (
                    <tr>
                      <td className="table-cell text-center text-slate-500" colSpan={5}>No users currently hold items.</td>
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
