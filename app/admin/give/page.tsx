import { Role } from "@prisma/client";
import { HandCoins } from "lucide-react";
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
        <p className="text-sm text-slate-600">
          Select a user, choose multiple inventory items, and give quantities in one handover.
        </p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <form action={giveItemAction} className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="panel p-5">
          <div className="sticky top-4 space-y-4">
            <h2 className="text-lg font-semibold text-ink">New Handover</h2>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="userId">
                User
              </label>
              <select className="field-input" id="userId" name="userId" required>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="notes">
                Batch notes
              </label>
              <textarea
                className="field-input min-h-24"
                id="notes"
                name="notes"
                placeholder="Optional note saved on every selected item"
              />
            </div>

            <div className="rounded-md border border-atelier-line bg-atelier-mist p-3 text-sm text-slate-700">
              Check each item to give, then enter the quantity for that item.
            </div>

            <button className="btn-primary w-full" type="submit">
              <HandCoins className="h-4 w-4" aria-hidden="true" />
              Give selected items
            </button>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Select Inventory Items</h2>
            <p className="text-sm text-slate-500">
              Available stock is listed here for faster multi-item handovers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="responsive-table min-w-[900px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Quantity to Give</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell" data-label="Select">
                      <input
                        aria-label={`Select ${item.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-atelier-teal focus:ring-atelier-teal"
                        name="itemIds"
                        type="checkbox"
                        value={item.id}
                      />
                    </td>
                    <td className="table-cell mobile-full" data-label="Item">
                      <div className="flex items-center gap-3">
                        <ItemPhoto imagePath={item.imagePath} name={item.name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.place}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Category">{item.category}</td>
                    <td className="table-cell" data-label="Available">
                      <Badge variant="green">{item.quantity}</Badge>
                    </td>
                    <td className="table-cell" data-label="Unit Price">{formatCurrency(toNumber(item.unitPrice))}</td>
                    <td className="table-cell" data-label="Quantity to Give">
                      <input
                        aria-label={`Quantity of ${item.name} to give`}
                        className="field-input max-w-28"
                        name={`quantity:${item.id}`}
                        type="number"
                        min="1"
                        max={item.quantity}
                        step="1"
                      />
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={6}>
                      No stock is currently available to hand over.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-atelier-line p-5">
          <h2 className="text-lg font-semibold text-ink">Current Items With Users</h2>
          <p className="text-sm text-slate-500">
            Total value given is based on remaining quantity and current item price.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="responsive-table min-w-[820px] w-full">
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
                  <td className="table-cell font-medium text-ink" data-label="User">{holding.userName}</td>
                  <td className="table-cell" data-label="Item">{holding.itemName}</td>
                  <td className="table-cell" data-label="Received">{holding.givenQuantity}</td>
                  <td className="table-cell" data-label="Remaining">
                    <Badge variant="teal">{holding.remainingQuantity}</Badge>
                  </td>
                  <td className="table-cell" data-label="Current Value">{formatCurrency(holding.currentValue)}</td>
                </tr>
              ))}
              {holdings.length === 0 ? (
                <tr>
                  <td className="table-cell text-center text-slate-500" colSpan={5}>
                    No users currently hold items.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
