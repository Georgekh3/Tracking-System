import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { StatusMessage } from "@/components/status-message";
import { returnItemAction } from "@/lib/actions/transactions";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function ReturnsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};
  const holdings = await getHoldings({ onlyRemaining: true });
  const users = Array.from(new Map(holdings.map((holding) => [holding.userId, holding])).values());

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Return Unused Items</h1>
        <p className="text-sm text-slate-600">Receive unused items back into Atelier stock and reduce user-held quantities.</p>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Receive Return</h2>
          <form action={returnItemAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="userId">User</label>
              <select className="field-input" id="userId" name="userId" required>
                <option value="">Select user</option>
                {users.map((holding) => (
                  <option key={holding.userId} value={holding.userId}>{holding.userName} · {holding.userEmail}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="itemId">Item currently with user</label>
              <select className="field-input" id="itemId" name="itemId" required>
                <option value="">Select item</option>
                {holdings.map((holding) => (
                  <option key={holding.key} value={holding.itemId}>
                    {holding.userName} · {holding.itemName} · {holding.remainingQuantity} remaining
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="quantity">Returned quantity</label>
              <input className="field-input" id="quantity" name="quantity" type="number" min="1" step="1" required />
            </div>

            <div className="space-y-1.5">
              <label className="field-label" htmlFor="notes">Notes</label>
              <textarea className="field-input min-h-24" id="notes" name="notes" />
            </div>

            <button className="btn-primary w-full" type="submit">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Receive return
            </button>
          </form>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-atelier-line p-5">
            <h2 className="text-lg font-semibold text-ink">Returnable Items</h2>
            <p className="text-sm text-slate-500">Only items with remaining user-held quantity can be returned.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.key}>
                    <td className="table-cell font-medium text-ink">{holding.userName}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <ItemPhoto imagePath={holding.itemImagePath} name={holding.itemName} size="sm" />
                        <span>{holding.itemName}</span>
                      </div>
                    </td>
                    <td className="table-cell">{holding.givenQuantity}</td>
                    <td className="table-cell">{holding.returnedQuantity}</td>
                    <td className="table-cell">
                      <Badge variant="teal">{holding.remainingQuantity}</Badge>
                    </td>
                    <td className="table-cell">{formatCurrency(holding.currentValue)}</td>
                  </tr>
                ))}
                {holdings.length === 0 ? (
                  <tr>
                    <td className="table-cell text-center text-slate-500" colSpan={6}>No returnable items.</td>
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
