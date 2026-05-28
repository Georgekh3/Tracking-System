"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveItemImage } from "@/lib/upload";
import { createItemSchema, updateItemSchema } from "@/lib/validation";
import { errorMessage, firstIssue, formFile, redirectWithMessage } from "@/lib/actions/helpers";

const ITEMS_PATH = "/admin/items";

export async function createItemAction(formData: FormData) {
  await requireAdmin();

  const parsed = createItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(ITEMS_PATH, "error", firstIssue(parsed.error));
  }

  const imageFile = formFile(formData.get("image"));
  if (!imageFile || imageFile.size === 0) {
    redirectWithMessage(ITEMS_PATH, "error", "Item photo is required.");
  }

  try {
    const imagePath = await saveItemImage(imageFile);
    if (!imagePath) throw new Error("Item photo is required.");

    await prisma.item.create({
      data: {
        ...parsed.data,
        unitPrice: new Prisma.Decimal(parsed.data.unitPrice),
        imagePath
      }
    });
  } catch (error) {
    redirectWithMessage(ITEMS_PATH, "error", errorMessage(error));
  }

  revalidatePath(ITEMS_PATH);
  redirectWithMessage(ITEMS_PATH, "success", "Item created.");
}

export async function updateItemAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(ITEMS_PATH, "error", firstIssue(parsed.error));
  }

  try {
    const imagePath = await saveItemImage(formFile(formData.get("image")));

    await prisma.item.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        quantity: parsed.data.quantity,
        unitPrice: new Prisma.Decimal(parsed.data.unitPrice),
        place: parsed.data.place,
        category: parsed.data.category,
        description: parsed.data.description,
        ...(imagePath ? { imagePath } : {})
      }
    });
  } catch (error) {
    redirectWithMessage(ITEMS_PATH, "error", errorMessage(error));
  }

  revalidatePath(ITEMS_PATH);
  revalidatePath("/admin");
  redirectWithMessage(ITEMS_PATH, "success", "Item updated.");
}

export async function deleteItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithMessage(ITEMS_PATH, "error", "Missing item id.");
  }

  try {
    await prisma.item.update({
      where: { id },
      data: { isDeleted: true }
    });
  } catch (error) {
    redirectWithMessage(ITEMS_PATH, "error", errorMessage(error));
  }

  revalidatePath(ITEMS_PATH);
  revalidatePath("/admin");
  redirectWithMessage(ITEMS_PATH, "success", "Item archived.");
}

export async function restoreItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithMessage("/admin/items/archived", "error", "Missing item id.");
  }

  try {
    await prisma.item.update({
      where: { id },
      data: { isDeleted: false }
    });
  } catch (error) {
    redirectWithMessage("/admin/items/archived", "error", errorMessage(error));
  }

  revalidatePath("/admin/items");
  revalidatePath("/admin/items/archived");
  revalidatePath("/admin");
  redirectWithMessage("/admin/items/archived", "success", "Item restored.");
}
