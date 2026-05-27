import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export type Holding = {
  key: string;
  userId: string;
  userName: string;
  userEmail: string;
  itemId: string;
  itemName: string;
  itemImagePath: string | null;
  itemUnitPrice: number;
  givenQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  currentValue: number;
};

type HoldingFilters = {
  userId?: string;
  itemId?: string;
  onlyRemaining?: boolean;
};

export async function getHoldings(filters: HoldingFilters = {}) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: filters.userId || undefined,
      itemId: filters.itemId || undefined
    },
    include: {
      item: true,
      user: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  const holdings = new Map<string, Holding>();

  for (const transaction of transactions) {
    const key = `${transaction.userId}:${transaction.itemId}`;
    const existing = holdings.get(key) ?? {
      key,
      userId: transaction.userId,
      userName: transaction.user.name,
      userEmail: transaction.user.email,
      itemId: transaction.itemId,
      itemName: transaction.item.name,
      itemImagePath: transaction.item.imagePath,
      itemUnitPrice: toNumber(transaction.item.unitPrice),
      givenQuantity: 0,
      returnedQuantity: 0,
      remainingQuantity: 0,
      currentValue: 0
    };

    if (transaction.type === TransactionType.GIVEN) {
      existing.givenQuantity += transaction.quantity;
    } else {
      existing.returnedQuantity += transaction.quantity;
    }

    existing.remainingQuantity = existing.givenQuantity - existing.returnedQuantity;
    existing.currentValue = existing.remainingQuantity * existing.itemUnitPrice;
    holdings.set(key, existing);
  }

  return Array.from(holdings.values())
    .filter((holding) => !filters.onlyRemaining || holding.remainingQuantity > 0)
    .sort((a, b) => a.userName.localeCompare(b.userName) || a.itemName.localeCompare(b.itemName));
}

export async function getHeldQuantity(userId: string, itemId: string) {
  const holdings = await getHoldings({ userId, itemId });
  return holdings[0]?.remainingQuantity ?? 0;
}
