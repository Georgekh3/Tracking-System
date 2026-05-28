import { Prisma, TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function dateFromInput(value?: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const params = request.nextUrl.searchParams;

  const where: Prisma.TransactionWhereInput = {};
  const type = params.get("type");
  if (params.get("userId")) where.userId = params.get("userId") ?? undefined;
  if (params.get("itemId")) where.itemId = params.get("itemId") ?? undefined;
  if (
    type === TransactionType.GIVEN ||
    type === TransactionType.RETURNED ||
    type === TransactionType.MISSING
  ) {
    where.type = type;
  }

  const from = dateFromInput(params.get("from"));
  const to = dateFromInput(params.get("to"), true);
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      item: true,
      user: true,
      createdByAdmin: true
    },
    orderBy: { createdAt: "desc" }
  });

  const rows = [
    ["Type", "User", "Item", "Quantity", "Unit Price", "Total", "Recorded By", "Notes", "Date"],
    ...transactions.map((transaction) => [
      transaction.type,
      transaction.user.name,
      transaction.item.name,
      transaction.quantity,
      toNumber(transaction.unitPrice).toFixed(2),
      toNumber(transaction.totalPrice).toFixed(2),
      transaction.createdByAdmin.name,
      transaction.notes ?? "",
      formatDate(transaction.createdAt)
    ])
  ];

  return new NextResponse(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="atelier-transactions-${Date.now()}.csv"`
    }
  });
}
