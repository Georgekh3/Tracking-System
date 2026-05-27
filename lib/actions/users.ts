"use server";

import { Prisma, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema, updateUserSchema } from "@/lib/validation";
import { errorMessage, firstIssue, redirectWithMessage } from "@/lib/actions/helpers";

const USERS_PATH = "/admin/users";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureAdminCanChangeTarget(targetId: string, nextRole?: Role, nextActive?: boolean) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, isActive: true }
  });

  if (!target) {
    throw new Error("User was not found.");
  }

  const wouldRemoveActiveAdmin =
    target.role === Role.ADMIN &&
    target.isActive &&
    (nextRole === Role.USER || nextActive === false);

  if (wouldRemoveActiveAdmin) {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true }
    });

    if (activeAdminCount <= 1) {
      throw new Error("At least one active admin must remain.");
    }
  }
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(USERS_PATH, "error", firstIssue(parsed.error));
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: normalizeEmail(parsed.data.email),
        passwordHash,
        role: parsed.data.role
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithMessage(USERS_PATH, "error", "A user with this email already exists.");
    }

    redirectWithMessage(USERS_PATH, "error", errorMessage(error));
  }

  revalidatePath(USERS_PATH);
  redirectWithMessage(USERS_PATH, "success", "User created.");
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithMessage(USERS_PATH, "error", firstIssue(parsed.error));
  }

  const password = parsed.data.password?.trim() ?? "";
  if (password && password.length < 8) {
    redirectWithMessage(USERS_PATH, "error", "Password must be at least 8 characters.");
  }

  try {
    await ensureAdminCanChangeTarget(parsed.data.id, parsed.data.role);

    await prisma.user.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        email: normalizeEmail(parsed.data.email),
        role: parsed.data.role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {})
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithMessage(USERS_PATH, "error", "A user with this email already exists.");
    }

    redirectWithMessage(USERS_PATH, "error", errorMessage(error));
  }

  revalidatePath(USERS_PATH);
  redirectWithMessage(USERS_PATH, "success", "User updated.");
}

export async function toggleUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithMessage(USERS_PATH, "error", "Missing user id.");
  }

  if (id === admin.id) {
    redirectWithMessage(USERS_PATH, "error", "You cannot deactivate your own account.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error("User was not found.");
    }

    await ensureAdminCanChangeTarget(id, undefined, !user.isActive);

    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
  } catch (error) {
    redirectWithMessage(USERS_PATH, "error", errorMessage(error));
  }

  revalidatePath(USERS_PATH);
  redirectWithMessage(USERS_PATH, "success", "User status updated.");
}
