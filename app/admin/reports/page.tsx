import { Prisma, TransactionType } from "@prisma/client";
import { Filter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { StatusMessage } from "@/components/status-message";
import { requireAdmin } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  userId?: string;
  itemId?: string;
  type?: string;
  from?: string;
  to?: string;
  success?: string;
  error?: string;
};

function dateFromInput(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};

  const where: Prisma.TransactionWhereInput = {};
  if (params.userId) where.userId = params.userId;
  if (params.itemId) where.itemId = params.itemId;
  if (params.type === TransactionType.GIVEN || params.type === TransactionType.RETURNED) {
    where.type = params.type;
  }

  const from = dateFromInput(params.from);
  const to = dateFromInput(params.to, true);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const [users, items, transactions, holdings, stockItems] = await Promise.all([
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    }),
    prisma.item.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" }
    }),
    prisma.transaction.findMany({
      where,
      include: {
        item: true,
        user: true,
        createdByAdmin: true
      },
      orderBy: { createdAt: "desc" }
    }),
    getHoldings({
      onlyRemaining: true,
      userId: params.userId || undefined,
      itemId: params.itemId || undefined
    }),
    prisma.item.findMany({
      where: { isDeleted: false },
      orderBy: [{ quantity: "asc" }, { name: "asc" }]
    })
  ]);

  const totalsByUser = Array.from(
    holdings.reduce((map, holding) => {
      const existing = map.get(holding.userId) ?? {
        userId: holding.userId,
        userName: holding.userName,
        quantity: 0,
        value: 0
      };

      existing.quantity += holding.remainingQuantity;
      existing.value += holding.currentValue;
      map.set(holding.userId, existing);
      return map;
    }, new Map<string, { userId: string; userName: string; quantity: number; value: number }>())
      .values()
  ).sort((a, b) => b.value - a.value);

  const returnedTransactions = transactions.filter((transaction) => transaction.type === TransactionType.RETURNED);
  const lowStockItems = stockItems.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD);

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-slate-600">Filter transaction history and review current stock, returns, and value held by users.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <form className="panel mb-6 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6" action="/admin/reports">
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="userId">User</label>
          <select className="field-input" id="userId" name="userId" defaultValue={params.userId ?? ""}>
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="itemId">Item</label>
          <select className="field-input" id="itemId" name="itemId" defaultValue={params.itemId ?? ""}>
            <option value="">All items</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="type">Type</label>
          <select className="field-input" id="type" name="type" defaultValue={params.type ?? ""}>
            <option value="">All types</option>
            <option value={TransactionType.GIVEN}>Given</option>
            <option value={TransactionType.RETURNED}>Returned</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="from">From</label>
          <input className="field-input" id="from" name="from" type="date" defaultValue={params.from ?? ""} />
        </div>
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="to">To</label>
          <input className="field-input" id="to" name="to" type="date" defaultValue={params.to ?? ""} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-primary flex-1" type="submit">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filter
          </button>
          <Link className="btn-secondary" href="/admin/reports" title="Clear filters">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </form>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Items Given by User</h2>
            <p className="text-sm text-slate-500">Net quantities currently held by each user.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.key}>
                    <td className="table-cell font-medium text-ink">{holding.userName}</td>
                    <td className="table-cell">{holding.itemName}</td>
                    <td className="table-cell">{holding.givenQuantity}</td>
                    <td className="table-cell">{holding.remainingQuantity}</td>
                    <td className="table-cell">{formatCurrency(holding.currentValue)}</td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={5}>No held items.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Total Value by User</h2>
            <p className="text-sm text-slate-500">Current user-held value using current item unit prices.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {totalsByUser.map((row) => (
                  <tr key={row.userId}>
                    <td className="table-cell font-medium text-ink">{row.userName}</td>
                    <td className="table-cell">{row.quantity}</td>
                    <td className="table-cell">{formatCurrency(row.value)}</td>
                  </tr>
                ))}
                {totalsByUser.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={3}>No user-held value.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Returned Items</h2>
            <p className="text-sm text-slate-500">Returned transactions within the current filter.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {returnedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="table-cell font-medium text-ink">{transaction.user.name}</td>
                    <td className="table-cell">{transaction.item.name}</td>
                    <td className="table-cell">{transaction.quantity}</td>
                    <td className="table-cell">{formatCurrency(toNumber(transaction.totalPrice))}</td>
                    <td className="table-cell whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))}
                {returnedTransactions.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={5}>No returned items for this filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Current Atelier Stock</h2>
            <p className="text-sm text-slate-500">Low-stock items are marked at quantity {LOW_STOCK_THRESHOLD} or below.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell font-medium text-ink">{item.name}</td>
                    <td className="table-cell">{item.category}</td>
                    <td className="table-cell">
                      <Badge variant={item.quantity <= LOW_STOCK_THRESHOLD ? "gold" : "green"}>{item.quantity}</Badge>
                    </td>
                    <td className="table-cell">{formatCurrency(item.quantity * toNumber(item.unitPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-atelier-line p-5">
          <h2 className="text-lg font-semibold text-ink">Full Transaction History</h2>
          <p className="text-sm text-slate-500">All matching handovers and returns.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="table-cell">
                    <Badge variant={transaction.type === TransactionType.GIVEN ? "teal" : "green"}>{transaction.type}</Badge>
                  </td>
                  <td className="table-cell font-medium text-ink">{transaction.user.name}</td>
                  <td className="table-cell">{transaction.item.name}</td>
                  <td className="table-cell">{transaction.quantity}</td>
                  <td className="table-cell">{formatCurrency(toNumber(transaction.unitPrice))}</td>
                  <td className="table-cell">{formatCurrency(toNumber(transaction.totalPrice))}</td>
                  <td className="table-cell">{transaction.createdByAdmin.name}</td>
                  <td className="table-cell whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                </tr>
              ))}
              {transactions.length === 0 ? (
                <tr>
                  <td className="table-cell text-center text-slate-500" colSpan={8}>No transactions match this filter.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold text-ink">Low Stock Items</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <Badge key={item.id} variant={item.quantity === 0 ? "red" : "gold"}>
                {item.name}: {item.quantity}
              </Badge>
            ))}
            {lowStockItems.length === 0 ? (
              <span className="text-sm text-slate-500">No low-stock items.</span>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
