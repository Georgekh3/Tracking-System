import { Boxes, CircleDollarSign, ClipboardList, PackageOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatCard } from "@/components/stat-card";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getAdminDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const dashboard = await getAdminDashboardData();

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-sm text-slate-600">Stock totals, held value, low stock, and recent movement.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total items" value={dashboard.totalItems} icon={Boxes} />
        <StatCard title="Atelier stock" value={dashboard.totalQuantity} detail="Units currently available" icon={PackageOpen} />
        <StatCard title="Stock value" value={formatCurrency(dashboard.totalStockValue)} icon={CircleDollarSign} />
        <StatCard title="Value with users" value={formatCurrency(dashboard.totalHeldValue)} icon={ClipboardList} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Low Stock</h2>
              <p className="text-sm text-slate-500">Quantity {LOW_STOCK_THRESHOLD} or below.</p>
            </div>
            <Badge variant="gold">{dashboard.lowStockItems.length} items</Badge>
          </div>

          <div className="space-y-3">
            {dashboard.lowStockItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-atelier-line p-4 text-sm text-slate-500">
                No low-stock items right now.
              </div>
            ) : (
              dashboard.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-md border border-atelier-line p-3">
                  <ItemPhoto imagePath={item.imagePath} name={item.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.category} · {item.place}</div>
                  </div>
                  <Badge variant={item.quantity === 0 ? "red" : "gold"}>{item.quantity} left</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Recent Transactions</h2>
            <p className="text-sm text-slate-500">Latest given and returned item activity.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell">
                      <Badge variant={transaction.type === "GIVEN" ? "teal" : "green"}>{transaction.type}</Badge>
                    </td>
                    <td className="table-cell font-medium text-ink">{transaction.item.name}</td>
                    <td className="table-cell">{transaction.user.name}</td>
                    <td className="table-cell">{transaction.quantity}</td>
                    <td className="table-cell">{formatCurrency(toNumber(transaction.totalPrice))}</td>
                    <td className="table-cell whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
