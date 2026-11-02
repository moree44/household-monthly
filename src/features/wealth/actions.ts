"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type WealthFormState = {
  error: string | null;
  success: string | null;
};

const holdingKindSchema = z.enum(["bank", "ewallet", "crypto", "cash", "other"]);
const assetKindSchema = z.enum(["vehicle", "property", "other"]);
const visibilitySchema = z.enum(["household", "private"]);

const holdingSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(60),
  kind: holdingKindSchema,
  institution: z.string().trim().max(60).optional(),
  currency: z.string().trim().max(8).optional(),
  quantity: z.string().trim().optional(),
  idrValue: z.string().trim().min(1, "Saldo/nilai rupiah wajib diisi."),
  visibility: visibilitySchema,
  notes: z.string().trim().max(200).optional()
});

const assetSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(60),
  kind: assetKindSchema,
  idrValue: z.string().trim().min(1, "Perkiraan nilai wajib diisi."),
  visibility: visibilitySchema,
  notes: z.string().trim().max(200).optional()
});

function parseRupiahInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? digits : null;
}

function parseQuantity(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".").trim();

  if (!normalized || Number.isNaN(Number(normalized))) {
    return null;
  }

  return normalized;
}

function revalidateWealth() {
  revalidatePath("/wealth");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

export async function createHoldingAction(
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  await requireUser();

  const parsed = holdingSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    institution: formData.get("institution") || undefined,
    currency: formData.get("currency") || undefined,
    quantity: formData.get("quantity") || undefined,
    idrValue: formData.get("idrValue"),
    visibility: formData.get("visibility"),
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data akun belum lengkap.", success: null };
  }

  const idrValue = parseRupiahInput(parsed.data.idrValue);

  if (!idrValue) {
    return { error: "Nilai rupiah tidak valid.", success: null };
  }

  const last = await prisma.holding.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  await prisma.holding.create({
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      institution: parsed.data.institution || null,
      currency: parsed.data.currency?.toUpperCase() || "IDR",
      quantity: parseQuantity(parsed.data.quantity),
      idrValue,
      visibility: parsed.data.visibility,
      notes: parsed.data.notes || null,
      sortOrder: (last?.sortOrder ?? 0) + 1
    }
  });

  revalidateWealth();
  return { error: null, success: "Akun ditambahkan." };
}

export async function updateHoldingBalanceAction(
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  await requireUser();
  const id = String(formData.get("holdingId") ?? "");
  const idrValue = parseRupiahInput(String(formData.get("idrValue") ?? ""));
  const quantity = parseQuantity(String(formData.get("quantity") ?? "") || undefined);

  if (!id || !idrValue) {
    return { error: "Saldo akun belum valid.", success: null };
  }

  await prisma.holding.update({
    where: { id },
    data: {
      idrValue,
      quantity
    }
  });

  revalidateWealth();
  return { error: null, success: "Saldo diupdate." };
}

export async function toggleHoldingAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("holdingId") ?? "");

  if (!id) {
    return;
  }

  const holding = await prisma.holding.findUnique({
    where: { id },
    select: { isActive: true }
  });

  if (!holding) {
    return;
  }

  await prisma.holding.update({
    where: { id },
    data: { isActive: !holding.isActive }
  });
  revalidateWealth();
}

export async function createAssetAction(
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  await requireUser();

  const parsed = assetSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    idrValue: formData.get("idrValue"),
    visibility: formData.get("visibility"),
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data aset belum lengkap.", success: null };
  }

  const idrValue = parseRupiahInput(parsed.data.idrValue);

  if (!idrValue) {
    return { error: "Nilai aset tidak valid.", success: null };
  }

  const last = await prisma.asset.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true }
  });

  await prisma.asset.create({
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      idrValue,
      visibility: parsed.data.visibility,
      notes: parsed.data.notes || null,
      sortOrder: (last?.sortOrder ?? 0) + 1
    }
  });

  revalidateWealth();
  return { error: null, success: "Aset ditambahkan." };
}

export async function updateAssetValueAction(
  _prevState: WealthFormState,
  formData: FormData
): Promise<WealthFormState> {
  await requireUser();
  const id = String(formData.get("assetId") ?? "");
  const idrValue = parseRupiahInput(String(formData.get("idrValue") ?? ""));

  if (!id || !idrValue) {
    return { error: "Nilai aset belum valid.", success: null };
  }

  await prisma.asset.update({
    where: { id },
    data: { idrValue }
  });

  revalidateWealth();
  return { error: null, success: "Nilai aset diupdate." };
}

export async function toggleAssetAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("assetId") ?? "");

  if (!id) {
    return;
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { isActive: true }
  });

  if (!asset) {
    return;
  }

  await prisma.asset.update({
    where: { id },
    data: { isActive: !asset.isActive }
  });
  revalidateWealth();
}
