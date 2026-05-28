import { Role } from "@prisma/client";
import { ClipboardList, CircleDollarSign, PackageCheck, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatCard } from "@/components/stat-card";
import { StatusMessage } from "@/components/status-message";
import { returnItemAction } from "@/lib/actions/transactions";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function UserDashboardPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await requireUser();
  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  const params = (await searchParams) ?? {};

  const [holdings, transactions] = await Promise.all([
    getHoldings({ userId: user.id, onlyRemaining: true }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        item: true,
        createdByAdmin: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const remainingQuantity = holdings.reduce((sum, holding) => sum + holding.remainingQuantity, 0);
  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">My Items</h1>
        <p className="text-sm text-slate-600">Items given to you, quantities remaining, value, and transaction history.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Item types held" value={holdings.length} icon={PackageCheck} />
        <StatCard title="Quantity remaining" value={remainingQuantity} icon={ClipboardList} />
        <StatCard title="Total value" value={formatCurrency(totalValue)} icon={CircleDollarSign} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Items Given to Me</h2>
            <p className="text-sm text-slate-500">Return unused quantities here after finishing your work.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="responsive-table min-w-[820px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Return</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.key}>
                    <td className="table-cell mobile-full" data-label="Item">
                      <div className="flex items-center gap-3">
                        <ItemPhoto imagePath={holding.itemImagePath} name={holding.itemName} size="sm" />
                        <span className="font-medium text-ink">{holding.itemName}</span>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Received">{holding.givenQuantity}</td>
                    <td className="table-cell" data-label="Remaining">
                      <Badge variant="teal">{holding.remainingQuantity}</Badge>
                    </td>
                    <td className="table-cell" data-label="Unit Price">{formatCurrency(holding.itemUnitPrice)}</td>
                    <td className="table-cell" data-label="Total Value">{formatCurrency(holding.currentValue)}</td>
                    <td className="table-cell mobile-full" data-label="Return">
                      <details className="rounded-md border border-atelier-line bg-white p-2">
                        <summary className="cursor-pointer text-sm font-medium text-atelier-teal">Return unused</summary>
                        <form action={returnItemAction} className="mt-3 grid gap-3">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="itemId" value={holding.itemId} />
                          <label className="field-label" htmlFor={`return-${holding.itemId}`}>
                            Quantity to return
                          </label>
                          <input
                            className="field-input"
                            id={`return-${holding.itemId}`}
                            name="quantity"
                            type="number"
                            min="1"
                            max={holding.remainingQuantity}
                            step="1"
                            required
                          />
                          <textarea
                            className="field-input min-h-20"
                            name="notes"
                            placeholder="Notes, optional"
                          />
                          <button className="btn-primary" type="submit">
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            Return
                          </button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={6}>No items are currently assigned to you.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Transaction History</h2>
            <p className="text-sm text-slate-500">All given and returned item records for your account.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="responsive-table min-w-[720px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell" data-label="Type">
                      <Badge variant={transaction.type === "GIVEN" ? "teal" : "green"}>{transaction.type}</Badge>
                    </td>
                    <td className="table-cell" data-label="Item">{transaction.item.name}</td>
                    <td className="table-cell" data-label="Qty">{transaction.quantity}</td>
                    <td className="table-cell" data-label="Value">{formatCurrency(toNumber(transaction.totalPrice))}</td>
                    <td className="table-cell whitespace-nowrap" data-label="Date">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={5}>No transaction history yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
