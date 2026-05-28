"use server";

import { Prisma, Role, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { giveItemsSchema, returnItemSchema } from "@/lib/validation";
import { errorMessage, firstIssue, redirectWithMessage } from "@/lib/actions/helpers";

const GIVE_PATH = "/admin/give";
const USER_DASHBOARD_PATH = "/dashboard";

export async function giveItemAction(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = giveItemsSchema.safeParse({
    userId: formData.get("userId"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    redirectWithMessage(GIVE_PATH, "error", firstIssue(parsed.error));
  }

  const selectedItemIds = Array.from(
    new Set(
      formData
        .getAll("itemIds")
        .map((value) => String(value))
        .filter(Boolean)
    )
  );

  if (selectedItemIds.length === 0) {
    redirectWithMessage(GIVE_PATH, "error", "Select at least one item to give.");
  }

  const handoverItems: { itemId: string; quantity: number }[] = [];

  for (const itemId of selectedItemIds) {
    const quantity = Number(formData.get(`quantity:${itemId}`));

    if (!Number.isInteger(quantity) || quantity <= 0) {
      redirectWithMessage(GIVE_PATH, "error", "Enter a positive quantity for every selected item.");
    }

    handoverItems.push({ itemId, quantity });
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

      const items = await tx.item.findMany({
        where: {
          id: { in: handoverItems.map((item) => item.itemId) },
          isDeleted: false
        }
      });

      const itemsById = new Map(items.map((item) => [item.id, item]));

      if (itemsById.size !== handoverItems.length) {
        throw new Error("One or more selected items were not found.");
      }

      for (const handoverItem of handoverItems) {
        const item = itemsById.get(handoverItem.itemId);
        if (!item) {
          throw new Error("One or more selected items were not found.");
        }

        const update = await tx.item.updateMany({
          where: {
            id: item.id,
            quantity: {
              gte: handoverItem.quantity
            }
          },
          data: {
            quantity: {
              decrement: handoverItem.quantity
            }
          }
        });

        if (update.count !== 1) {
          throw new Error(`Not enough stock available for ${item.name}.`);
        }

        const unitPrice = new Prisma.Decimal(item.unitPrice);

        await tx.transaction.create({
          data: {
            itemId: item.id,
            userId: user.id,
            type: TransactionType.GIVEN,
            quantity: handoverItem.quantity,
            unitPrice,
            totalPrice: unitPrice.mul(handoverItem.quantity),
            notes: parsed.data.notes || null,
            createdByAdminId: admin.id
          }
        });
      }
    });
  } catch (error) {
    redirectWithMessage(GIVE_PATH, "error", errorMessage(error));
  }

  revalidatePath(GIVE_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirectWithMessage(GIVE_PATH, "success", "Selected items given and stock updated.");
}

export async function returnItemAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== Role.USER) {
    redirectWithMessage("/admin", "error", "Only users can return their unused items.");
  }

  const parsed = returnItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(USER_DASHBOARD_PATH, "error", firstIssue(parsed.error));
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.userId && parsed.data.userId !== user.id) {
        throw new Error("You can only return items assigned to your account.");
      }

      const [item, transactions] = await Promise.all([
        tx.item.findUnique({
          where: { id: parsed.data.itemId }
        }),
        tx.transaction.findMany({
          where: {
            userId: user.id,
            itemId: parsed.data.itemId
          },
          select: {
            type: true,
            quantity: true
          }
        })
      ]);

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
          createdByAdminId: user.id
        }
      });
    });
  } catch (error) {
    redirectWithMessage(USER_DASHBOARD_PATH, "error", errorMessage(error));
  }

  revalidatePath(USER_DASHBOARD_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  redirectWithMessage(USER_DASHBOARD_PATH, "success", "Returned items sent back to Atelier stock.");
}
