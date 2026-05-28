import { Role } from "@prisma/client";
import { AlertTriangle, ClipboardList, PackageCheck, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatCard } from "@/components/stat-card";
import { StatusMessage } from "@/components/status-message";
import { markMissingItemAction, returnItemAction } from "@/lib/actions/transactions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
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

  const [holdings, allHoldings, transactions] = await Promise.all([
    getHoldings({ userId: user.id, onlyRemaining: true }),
    getHoldings({ userId: user.id }),
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
  const missingQuantity = allHoldings.reduce((sum, holding) => sum + holding.missingQuantity, 0);

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">My Items</h1>
        <p className="text-sm text-slate-600">Items given to you, quantities remaining, returns, and missing/damaged records.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Item types held" value={holdings.length} icon={PackageCheck} />
        <StatCard title="Quantity remaining" value={remainingQuantity} icon={ClipboardList} />
        <StatCard title="Missing or damaged" value={missingQuantity} icon={AlertTriangle} />
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
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Missing</th>
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3">Missing/Damaged</th>
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
                    <td className="table-cell" data-label="Returned">{holding.returnedQuantity}</td>
                    <td className="table-cell" data-label="Missing">{holding.missingQuantity}</td>
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
                        <form action={returnItemAction} className="mt-2">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="itemId" value={holding.itemId} />
                          <input type="hidden" name="quantity" value={holding.remainingQuantity} />
                          <input type="hidden" name="notes" value="Returned all remaining unused items." />
                          <button className="btn-secondary w-full" type="submit">
                            Return all {holding.remainingQuantity}
                          </button>
                        </form>
                      </details>
                    </td>
                    <td className="table-cell mobile-full" data-label="Missing/Damaged">
                      <details className="rounded-md border border-atelier-line bg-white p-2">
                        <summary className="cursor-pointer text-sm font-medium text-atelier-coral">Report missing/damaged</summary>
                        <form action={markMissingItemAction} className="mt-3 grid gap-3">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="itemId" value={holding.itemId} />
                          <label className="field-label" htmlFor={`missing-${holding.itemId}`}>
                            Quantity missing or damaged
                          </label>
                          <input
                            className="field-input"
                            id={`missing-${holding.itemId}`}
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
                            placeholder="Explain what happened"
                            required
                          />
                          <button className="btn-danger" type="submit">
                            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                            Report missing/damaged
                          </button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={7}>No items are currently assigned to you.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Transaction History</h2>
            <p className="text-sm text-slate-500">All given, returned, and missing/damaged item records for your account.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="responsive-table min-w-[720px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell" data-label="Type">
                      <Badge
                        variant={
                          transaction.type === "GIVEN"
                            ? "teal"
                            : transaction.type === "RETURNED"
                              ? "green"
                              : "red"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="table-cell" data-label="Item">{transaction.item.name}</td>
                    <td className="table-cell" data-label="Qty">{transaction.quantity}</td>
                    <td className="table-cell whitespace-nowrap" data-label="Date">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={4}>No transaction history yet.</td>
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
