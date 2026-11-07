import type { AssetKind, HoldingKind, TransactionType, Visibility, WalletType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";

function decimalToNumber(value: { toString(): string } | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function signedWalletTransactionAmount({
  amount,
  adjustmentDirection,
  type
}: {
  amount: { toString(): string } | null | undefined;
  adjustmentDirection: "increase" | "decrease" | null;
  type: TransactionType;
}) {
  const numericAmount = decimalToNumber(amount);

  if (type === "top_up") {
    return numericAmount;
  }

  if (type === "expense") {
    return -numericAmount;
  }

  if (type === "adjustment") {
    return adjustmentDirection === "decrease" ? -numericAmount : numericAmount;
  }

  return 0;
}

export type WealthHolding = {
  id: string;
  name: string;
  kind: HoldingKind;
  institution: string | null;
  currency: string;
  quantity: number | null;
  idrValue: number;
  visibility: Visibility;
  notes: string | null;
  isActive: boolean;
};

export type WealthAsset = {
  id: string;
  name: string;
  kind: AssetKind;
  idrValue: number;
  visibility: Visibility;
  notes: string | null;
  isActive: boolean;
};

async function loadWealthOverview(canSeePrivate: boolean) {
  const visibilityFilter: Visibility[] = canSeePrivate ? ["household", "private"] : ["household"];

  const [
    wallets,
    walletTransactionGroups,
    transferOutGroups,
    transferInGroups,
    holdings,
    assets
  ] = await Promise.all([
    prisma.wallet.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        initialBalance: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["walletId", "type", "adjustmentDirection"],
      where: {
        deletedAt: null,
        walletId: { not: null }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ["fromWalletId"],
      where: {
        deletedAt: null,
        type: "transfer",
        fromWalletId: { not: null }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ["toWalletId"],
      where: {
        deletedAt: null,
        type: "transfer",
        toWalletId: { not: null }
      },
      _sum: { amount: true }
    }),
    prisma.holding.findMany({
      where: {
        visibility: { in: visibilityFilter }
      },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.asset.findMany({
      where: {
        visibility: { in: visibilityFilter }
      },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  const walletTransactionBalanceById = new Map<string, number>();
  const transferOutByWalletId = new Map<string, number>();
  const transferInByWalletId = new Map<string, number>();

  for (const group of walletTransactionGroups) {
    if (!group.walletId) {
      continue;
    }

    walletTransactionBalanceById.set(
      group.walletId,
      (walletTransactionBalanceById.get(group.walletId) ?? 0) +
        signedWalletTransactionAmount({
          amount: group._sum.amount,
          adjustmentDirection: group.adjustmentDirection,
          type: group.type
        })
    );
  }

  for (const group of transferOutGroups) {
    if (group.fromWalletId) {
      transferOutByWalletId.set(group.fromWalletId, decimalToNumber(group._sum.amount));
    }
  }

  for (const group of transferInGroups) {
    if (group.toWalletId) {
      transferInByWalletId.set(group.toWalletId, decimalToNumber(group._sum.amount));
    }
  }

  const operationalWallets = wallets.map((wallet) => {
    const transactionBalance = walletTransactionBalanceById.get(wallet.id) ?? 0;
    const transferOut = transferOutByWalletId.get(wallet.id) ?? 0;
    const transferIn = transferInByWalletId.get(wallet.id) ?? 0;

    return {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type as WalletType,
      balance: decimalToNumber(wallet.initialBalance) + transactionBalance + transferIn - transferOut
    };
  });

  const mappedHoldings: WealthHolding[] = holdings.map((holding) => ({
    id: holding.id,
    name: holding.name,
    kind: holding.kind,
    institution: holding.institution,
    currency: holding.currency,
    quantity: holding.quantity ? decimalToNumber(holding.quantity) : null,
    idrValue: decimalToNumber(holding.idrValue),
    visibility: holding.visibility,
    notes: holding.notes,
    isActive: holding.isActive
  }));

  const mappedAssets: WealthAsset[] = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    idrValue: decimalToNumber(asset.idrValue),
    visibility: asset.visibility,
    notes: asset.notes,
    isActive: asset.isActive
  }));

  const operationalTotal = operationalWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const holdingTotal = mappedHoldings
    .filter((holding) => holding.isActive)
    .reduce((sum, holding) => sum + holding.idrValue, 0);
  const assetTotal = mappedAssets
    .filter((asset) => asset.isActive)
    .reduce((sum, asset) => sum + asset.idrValue, 0);

  return {
    operationalWallets,
    holdings: mappedHoldings,
    assets: mappedAssets,
    operationalTotal,
    holdingTotal,
    assetTotal,
    netWorth: operationalTotal + holdingTotal + assetTotal
  };
}

// Overview kekayaan jarang berubah; cache dengan visibility sebagai bagian
// kunci supaya admin dan member dapat tembolok masing-masing.
export function getWealthOverview(canSeePrivate: boolean) {
  return unstable_cache(
    loadWealthOverview,
    ["wealth-data", String(canSeePrivate)],
    { tags: ["finance-data"], revalidate: 900 }
  )(canSeePrivate);
}
