"use server";

import { Prisma, Role, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { giveItemSchema, returnItemSchema } from "@/lib/validation";
import { errorMessage, firstIssue, redirectWithMessage } from "@/lib/actions/helpers";

const GIVE_PATH = "/admin/give";
const RETURNS_PATH = "/admin/returns";

export async function giveItemAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = giveItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(GIVE_PATH, "error", firstIssue(parsed.error));
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id: parsed.data.userId,
          role: Role.USER,
          isActive: true
        },
        select: { id: true }
      });

      if (!user) {
        throw new Error("Select an active user.");
      }

      const item = await tx.item.findFirst({
        where: {
          id: parsed.data.itemId,
          isDeleted: false
        }
      });

      if (!item) {
        throw new Error("Item was not found.");
      }

      const update = await tx.item.updateMany({
        where: {
          id: item.id,
          quantity: {
            gte: parsed.data.quantity
          }
        },
        data: {
          quantity: {
            decrement: parsed.data.quantity
          }
        }
      });

      if (update.count !== 1) {
        throw new Error("Not enough stock available for this handover.");
      }

      const unitPrice = new Prisma.Decimal(item.unitPrice);

      await tx.transaction.create({
        data: {
          itemId: item.id,
          userId: user.id,
          type: TransactionType.GIVEN,
          quantity: parsed.data.quantity,
          unitPrice,
          totalPrice: unitPrice.mul(parsed.data.quantity),
          notes: parsed.data.notes || null,
          createdByAdminId: admin.id
        }
      });
    });
  } catch (error) {
    redirectWithMessage(GIVE_PATH, "error", errorMessage(error));
  }

  revalidatePath(GIVE_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirectWithMessage(GIVE_PATH, "success", "Items given and stock updated.");
}

export async function returnItemAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = returnItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(RETURNS_PATH, "error", firstIssue(parsed.error));
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [user, item, transactions] = await Promise.all([
        tx.user.findUnique({
          where: { id: parsed.data.userId },
          select: { id: true }
        }),
        tx.item.findUnique({
          where: { id: parsed.data.itemId }
        }),
        tx.transaction.findMany({
          where: {
            userId: parsed.data.userId,
            itemId: parsed.data.itemId
          },
          select: {
            type: true,
            quantity: true
          }
        })
      ]);

      if (!user) {
        throw new Error("User was not found.");
      }

      if (!item) {
        throw new Error("Item was not found.");
      }

      const heldQuantity = transactions.reduce((sum, transaction) => {
        return transaction.type === TransactionType.GIVEN
          ? sum + transaction.quantity
          : sum - transaction.quantity;
      }, 0);

      if (parsed.data.quantity > heldQuantity) {
        throw new Error("Returned quantity cannot be more than the user currently has.");
      }

      await tx.item.update({
        where: { id: item.id },
        data: {
          quantity: {
            increment: parsed.data.quantity
          }
        }
      });

      const unitPrice = new Prisma.Decimal(item.unitPrice);

      await tx.transaction.create({
        data: {
          itemId: item.id,
          userId: user.id,
          type: TransactionType.RETURNED,
          quantity: parsed.data.quantity,
          unitPrice,
          totalPrice: unitPrice.mul(parsed.data.quantity),
          notes: parsed.data.notes || null,
          createdByAdminId: admin.id
        }
      });
    });
  } catch (error) {
    redirectWithMessage(RETURNS_PATH, "error", errorMessage(error));
  }

  revalidatePath(RETURNS_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirectWithMessage(RETURNS_PATH, "success", "Returned items received and stock updated.");
}
