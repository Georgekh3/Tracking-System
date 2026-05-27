import { Role } from "@prisma/client";
import { ClipboardList, CircleDollarSign, PackageCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";
import { prisma } from "@/lib/prisma";

export default async function UserDashboardPage() {
  const user = await requireUser();
  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

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

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Item types held" value={holdings.length} icon={PackageCheck} />
        <StatCard title="Quantity remaining" value={remainingQuantity} icon={ClipboardList} />
        <StatCard title="Total value" value={formatCurrency(totalValue)} icon={CircleDollarSign} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Items Given to Me</h2>
            <p className="text-sm text-slate-500">Remaining quantity reflects returns already received by admins.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.key}>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <ItemPhoto imagePath={holding.itemImagePath} name={holding.itemName} size="sm" />
                        <span className="font-medium text-ink">{holding.itemName}</span>
                      </div>
                    </td>
                    <td className="table-cell">{holding.givenQuantity}</td>
                    <td className="table-cell">
                      <Badge variant="teal">{holding.remainingQuantity}</Badge>
                    </td>
                    <td className="table-cell">{formatCurrency(holding.itemUnitPrice)}</td>
                    <td className="table-cell">{formatCurrency(holding.currentValue)}</td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={5}>No items are currently assigned to you.</td>
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
            <table className="min-w-[720px] w-full">
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
                    <td className="table-cell">
                      <Badge variant={transaction.type === "GIVEN" ? "teal" : "green"}>{transaction.type}</Badge>
                    </td>
                    <td className="table-cell">{transaction.item.name}</td>
                    <td className="table-cell">{transaction.quantity}</td>
                    <td className="table-cell">{formatCurrency(toNumber(transaction.totalPrice))}</td>
                    <td className="table-cell whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
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
