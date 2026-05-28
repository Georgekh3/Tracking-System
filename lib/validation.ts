import { Role, TransactionType } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export const createItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  quantity: z.coerce.number().int().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().positive("Unit price must be positive."),
  place: z.string().trim().min(1, "Place is required."),
  category: z.string().trim().min(1, "Category is required."),
  description: z.string().trim().min(1, "Description is required.")
});

export const updateItemSchema = createItemSchema.extend({
  id: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative("Quantity cannot be negative.")
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.nativeEnum(Role)
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  isActive: z.coerce.boolean().optional()
});

export const giveItemsSchema = z.object({
  userId: z.string().min(1, "Select a user."),
  notes: z.string().trim().optional()
});

export const returnItemSchema = z.object({
  userId: z.string().optional(),
  itemId: z.string().min(1, "Select an item."),
  quantity: z.coerce.number().int().positive("Quantity must be positive."),
  notes: z.string().trim().optional()
});

export const missingItemSchema = returnItemSchema.extend({
  notes: z.string().trim().min(1, "Add a note explaining what is missing or damaged.")
});

export const reportFiltersSchema = z.object({
  userId: z.string().optional(),
  itemId: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional().or(z.literal("")),
  from: z.string().optional(),
  to: z.string().optional()
});
