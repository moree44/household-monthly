-- CreateEnum
CREATE TYPE "HoldingKind" AS ENUM ('bank', 'ewallet', 'crypto', 'cash', 'other');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('vehicle', 'property', 'other');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('household', 'private');

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "HoldingKind" NOT NULL,
    "institution" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "quantity" DECIMAL(20,8),
    "idr_value" DECIMAL(16,2) NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'household',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "idr_value" DECIMAL(16,2) NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'household',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "holdings_kind_is_active_idx" ON "holdings"("kind", "is_active");

-- CreateIndex
CREATE INDEX "holdings_sort_order_idx" ON "holdings"("sort_order");

-- CreateIndex
CREATE INDEX "assets_kind_is_active_idx" ON "assets"("kind", "is_active");

-- CreateIndex
CREATE INDEX "assets_sort_order_idx" ON "assets"("sort_order");
