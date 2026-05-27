import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { toNumber } from "@/lib/format";
import { getHoldings } from "@/lib/holdings";
import { prisma } from "@/lib/prisma";

export async function getAdminDashboardData() {
  const [items, recentTransactions] = await Promise.all([
    prisma.item.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" }
    }),
    prisma.transaction.findMany({
      take: 8,
      include: {
        item: true,
        user: true,
        createdByAdmin: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const holdings = await getHoldings({ onlyRemaining: true });

  return {
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalStockValue: items.reduce(
      (sum, item) => sum + item.quantity * toNumber(item.unitPrice),
      0
    ),
    totalHeldValue: holdings.reduce((sum, holding) => sum + holding.currentValue, 0),
    lowStockItems: items
      .filter((item) => item.quantity <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.quantity - b.quantity),
    recentTransactions
  };
}
