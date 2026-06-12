"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type WalletFormState = {
  error: string | null;
  success: string | null;
};

const walletTypeSchema = z.enum(["operational", "wife", "home_setup", "emergency", "custom"]);

const walletSchema = z.object({
  name: z.string().trim().min(2, "Nama wallet minimal 2 huruf.").max(60, "Nama wallet terlalu panjang."),
  type: walletTypeSchema,
  initialBalance: z.string().trim().optional()
});

const walletIdSchema = z.object({
  walletId: z.string().min(1, "Wallet tidak ditemukan.")
});

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function parseRupiahInput(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^\d-]/g, "");

  if (!normalized || normalized === "-") {
    return 0;
  }

  return Number(normalized);
}

function revalidateWalletViews() {
  revalidatePath("/settings/wallets");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/expenses/new");
  revalidatePath("/transfers/new");
  revalidatePath("/top-ups/new");
}

export async function createWalletAction(
  _prevState: WalletFormState,
  formData: FormData
): Promise<WalletFormState> {
  await requireUser();

  const parsed = walletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input wallet belum valid.",
      success: null
    };
  }

  const name = cleanName(parsed.data.name);
  const existingWallet = await prisma.wallet.findUnique({
    where: { name },
    select: { id: true, isActive: true }
  });

  if (existingWallet) {
    return {
      error: existingWallet.isActive
        ? "Wallet ini sudah ada."
        : "Wallet ini sudah ada di daftar nonaktif. Aktifkan lagi dari list bawah.",
      success: null
    };
  }

  const maxSortOrder = await prisma.wallet.aggregate({
    _max: {
      sortOrder: true
    }
  });

  await prisma.wallet.create({
    data: {
      name,
      type: parsed.data.type,
      initialBalance: parseRupiahInput(parsed.data.initialBalance),
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidateWalletViews();

  return {
    error: null,
    success: "Wallet ditambahkan."
  };
}

export async function updateWalletAction(
  _prevState: WalletFormState,
  formData: FormData
): Promise<WalletFormState> {
  await requireUser();

  const parsedId = walletIdSchema.safeParse({
    walletId: formData.get("walletId")
  });
  const parsedWallet = walletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance")
  });

  if (!parsedId.success || !parsedWallet.success) {
    return {
      error: parsedWallet.error?.issues[0]?.message ?? parsedId.error?.issues[0]?.message ?? "Input belum valid.",
      success: null
    };
  }

  const name = cleanName(parsedWallet.data.name);
  const duplicate = await prisma.wallet.findFirst({
    where: {
      name,
      id: {
        not: parsedId.data.walletId
      }
    },
    select: {
      id: true
    }
  });

  if (duplicate) {
    return {
      error: "Nama wallet sudah dipakai.",
      success: null
    };
  }

  await prisma.wallet.update({
    where: {
      id: parsedId.data.walletId
    },
    data: {
      name,
      type: parsedWallet.data.type,
      initialBalance: parseRupiahInput(parsedWallet.data.initialBalance)
    }
  });

  revalidateWalletViews();

  return {
    error: null,
    success: "Wallet disimpan."
  };
}

export async function toggleWalletAction(
  _prevState: WalletFormState,
  formData: FormData
): Promise<WalletFormState> {
  await requireUser();

  const parsedId = walletIdSchema.safeParse({
    walletId: formData.get("walletId")
  });

  if (!parsedId.success) {
    return {
      error: parsedId.error.issues[0]?.message ?? "Wallet tidak ditemukan.",
      success: null
    };
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      id: parsedId.data.walletId
    },
    select: {
      isActive: true
    }
  });

  if (!wallet) {
    return {
      error: "Wallet tidak ditemukan.",
      success: null
    };
  }

  await prisma.wallet.update({
    where: {
      id: parsedId.data.walletId
    },
    data: {
      isActive: !wallet.isActive
    }
  });

  revalidateWalletViews();

  return {
    error: null,
    success: wallet.isActive ? "Wallet dinonaktifkan." : "Wallet diaktifkan."
  };
}
