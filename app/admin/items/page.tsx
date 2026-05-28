import { Prisma } from "@prisma/client";
import { Archive, PackagePlus, Save, Search } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ItemPhoto } from "@/components/item-photo";
import { StatusMessage } from "@/components/status-message";
import { createItemAction, deleteItemAction, updateItemAction } from "@/lib/actions/items";
import { requireAdmin } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatCurrency, formatShortDate, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SearchParams = {
  q?: string;
  page?: string;
  success?: string;
  error?: string;
};

export default async function AdminItemsPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = 25;

  const where: Prisma.ItemWhereInput = { isDeleted: false };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
      { place: { contains: query, mode: "insensitive" } }
    ];
  }

  const [items, itemCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.item.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const pageHref = (nextPage: number) =>
    `/admin/items?${new URLSearchParams({
      ...(query ? { q: query } : {}),
      page: String(nextPage)
    }).toString()}`;

  return (
    <AppShell user={admin}>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="page-title">Inventory Management</h1>
        <p className="text-sm text-slate-600">Create, edit, archive, and search Atelier stock items.</p>
        <Link className="text-sm font-medium text-atelier-teal hover:underline" href="/admin/items/archived">
          View archived items
        </Link>
      </div>

      <StatusMessage success={params.success} error={params.error} />

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-ink">Create Item</h2>
          <form action={createItemAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="name">Name</label>
              <input className="field-input" id="name" name="name" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="field-label" htmlFor="quantity">Quantity</label>
                <input className="field-input" id="quantity" name="quantity" type="number" min="1" step="1" required />
              </div>
              <div className="space-y-1.5">
                <label className="field-label" htmlFor="unitPrice">Unit price</label>
                <input className="field-input" id="unitPrice" name="unitPrice" type="number" min="0.01" step="0.01" required />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="field-label" htmlFor="place">Place</label>
                <input className="field-input" id="place" name="place" required />
              </div>
              <div className="space-y-1.5">
                <label className="field-label" htmlFor="category">Category</label>
                <input className="field-input" id="category" name="category" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="description">Description</label>
              <textarea className="field-input min-h-24" id="description" name="description" required />
            </div>
            <div className="space-y-1.5">
              <label className="field-label" htmlFor="image">Photo</label>
              <input className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-atelier-mist file:px-3 file:py-2 file:text-sm file:font-medium file:text-atelier-teal" id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required />
            </div>
            <button className="btn-primary w-full" type="submit">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              Create item
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <form className="panel flex flex-col gap-3 p-4 sm:flex-row" action="/admin/items">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input className="field-input pl-9" name="q" defaultValue={query} placeholder="Search by name, category, or place" />
            </div>
            <button className="btn-secondary" type="submit">Search</button>
          </form>

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="responsive-table min-w-[980px] w-full">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Total Value</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const unitPrice = toNumber(item.unitPrice);
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="table-cell mobile-full" data-label="Item">
                          <div className="flex items-start gap-3">
                            <ItemPhoto imagePath={item.imagePath} name={item.name} />
                            <div className="min-w-0">
                              <div className="font-medium text-ink">{item.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{item.place}</div>
                              <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell" data-label="Category">{item.category}</td>
                        <td className="table-cell" data-label="Stock">
                          <Badge variant={item.quantity <= LOW_STOCK_THRESHOLD ? "gold" : "green"}>{item.quantity}</Badge>
                        </td>
                        <td className="table-cell" data-label="Unit Price">{formatCurrency(unitPrice)}</td>
                        <td className="table-cell" data-label="Total Value">{formatCurrency(item.quantity * unitPrice)}</td>
                        <td className="table-cell whitespace-nowrap" data-label="Created">{formatShortDate(item.createdAt)}</td>
                        <td className="table-cell mobile-full" data-label="Actions">
                          <div className="flex flex-col gap-2">
                            <details className="rounded-md border border-atelier-line bg-white p-2">
                              <summary className="cursor-pointer text-sm font-medium text-atelier-teal">Edit</summary>
                              <form action={updateItemAction} className="mt-3 grid gap-3">
                                <input type="hidden" name="id" value={item.id} />
                                <input className="field-input" name="name" defaultValue={item.name} required />
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <input className="field-input" name="quantity" type="number" min="0" step="1" defaultValue={item.quantity} required />
                                  <input className="field-input" name="unitPrice" type="number" min="0.01" step="0.01" defaultValue={unitPrice} required />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <input className="field-input" name="place" defaultValue={item.place} required />
                                  <input className="field-input" name="category" defaultValue={item.category} required />
                                </div>
                                <textarea className="field-input min-h-20" name="description" defaultValue={item.description} required />
                                <input className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-atelier-mist file:px-3 file:py-2 file:text-sm file:font-medium file:text-atelier-teal" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                                <button className="btn-primary" type="submit">
                                  <Save className="h-4 w-4" aria-hidden="true" />
                                  Save
                                </button>
                              </form>
                            </details>
                            <form action={deleteItemAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <ConfirmSubmitButton
                                className="btn-danger w-full"
                                icon={Archive}
                                message={`Archive ${item.name}? It will disappear from active inventory.`}
                              >
                                Archive
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 ? (
                    <tr>
                      <td className="table-cell text-center text-slate-500" colSpan={7}>No items found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages} - {itemCount} active items
            </div>
            <div className="flex gap-2">
              <Link className="btn-secondary" href={pageHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
                Previous
              </Link>
              <Link className="btn-secondary" href={pageHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>
                Next
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
