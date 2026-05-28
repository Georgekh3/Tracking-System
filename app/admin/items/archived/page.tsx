import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ItemPhoto } from "@/components/item-photo";
import { StatusMessage } from "@/components/status-message";
import { restoreItemAction } from "@/lib/actions/items";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, formatShortDate, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function ArchivedItemsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};
  const items = await prisma.item.findMany({
    where: { isDeleted: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Archived Items</h1>
        <p className="text-sm text-slate-600">Restore archived inventory items when they should become active again.</p>
        <Link className="text-sm font-medium text-atelier-teal hover:underline" href="/admin/items">
          Back to active inventory
        </Link>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="responsive-table min-w-[760px] w-full">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Archived</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const unitPrice = toNumber(item.unitPrice);
                return (
                  <tr key={item.id}>
                    <td className="table-cell mobile-full" data-label="Item">
                      <div className="flex items-center gap-3">
                        <ItemPhoto imagePath={item.imagePath} name={item.name} size="sm" />
                        <span className="font-medium text-ink">{item.name}</span>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Category">{item.category}</td>
                    <td className="table-cell" data-label="Stock">{item.quantity}</td>
                    <td className="table-cell" data-label="Value">{formatCurrency(item.quantity * unitPrice)}</td>
                    <td className="table-cell" data-label="Archived">{formatShortDate(item.updatedAt)}</td>
                    <td className="table-cell mobile-full" data-label="Action">
                      <form action={restoreItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmSubmitButton
                          className="btn-secondary w-full"
                          icon="restore"
                          message={`Restore ${item.name} to active inventory?`}
                        >
                          Restore
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 ? (
                <tr>
                  <td className="table-cell text-center text-slate-500" colSpan={6}>
                    No archived items.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
