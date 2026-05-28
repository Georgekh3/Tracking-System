"use client";

import { useMemo, useState } from "react";
import { HandCoins, Search } from "lucide-react";
import { Badge } from "@/components/badge";
import { ItemPhoto } from "@/components/item-photo";
import { formatCurrency } from "@/lib/format";
import { giveItemAction } from "@/lib/actions/transactions";

type GiveUser = {
  id: string;
  name: string;
  email: string;
};

type GiveItem = {
  id: string;
  name: string;
  imagePath: string | null;
  quantity: number;
  unitPrice: number;
  place: string;
  category: string;
};

export function GiveItemsForm({ users, items }: { users: GiveUser[]; items: GiveItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.name, item.category, item.place].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [items, search]);

  const selectedSummary = useMemo(() => {
    return items.reduce(
      (summary, item) => {
        if (!selectedItems[item.id]) return summary;
        const quantity = Number(quantities[item.id] || 0);
        if (!Number.isFinite(quantity) || quantity <= 0) return summary;

        summary.count += 1;
        summary.quantity += quantity;
        summary.value += quantity * item.unitPrice;
        return summary;
      },
      { count: 0, quantity: 0, value: 0 }
    );
  }, [items, quantities, selectedItems]);

  return (
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
            <div className="font-medium text-ink">{selectedSummary.count} item types selected</div>
            <div className="mt-1">Total quantity: {selectedSummary.quantity}</div>
            <div>Total value: {formatCurrency(selectedSummary.value)}</div>
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
            Type a quantity to auto-select an item, or use the checkbox directly.
          </p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="field-input pl-9"
              placeholder="Search by item, category, or place"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
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
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell" data-label="Select">
                    <input
                      aria-label={`Select ${item.name}`}
                      checked={Boolean(selectedItems[item.id])}
                      className="h-4 w-4 rounded border-slate-300 text-atelier-teal focus:ring-atelier-teal"
                      name="itemIds"
                      type="checkbox"
                      value={item.id}
                      onChange={(event) =>
                        setSelectedItems((current) => ({
                          ...current,
                          [item.id]: event.target.checked
                        }))
                      }
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
                  <td className="table-cell" data-label="Unit Price">{formatCurrency(item.unitPrice)}</td>
                  <td className="table-cell" data-label="Quantity to Give">
                    <input
                      aria-label={`Quantity of ${item.name} to give`}
                      className="field-input max-w-28"
                      name={`quantity:${item.id}`}
                      type="number"
                      min="1"
                      max={item.quantity}
                      step="1"
                      value={quantities[item.id] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setQuantities((current) => ({ ...current, [item.id]: value }));
                        setSelectedItems((current) => ({
                          ...current,
                          [item.id]: Number(value) > 0
                        }));
                      }}
                    />
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 ? (
                <tr>
                  <td className="table-cell text-center text-slate-500" colSpan={6}>
                    No available stock matches this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
