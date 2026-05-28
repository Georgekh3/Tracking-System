import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { StatusMessage } from "@/components/status-message";
import { GiveItemsForm } from "@/app/admin/give/give-items-form";
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

      <GiveItemsForm
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email
        }))}
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          imagePath: item.imagePath,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          place: item.place,
          category: item.category
        }))}
      />

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
