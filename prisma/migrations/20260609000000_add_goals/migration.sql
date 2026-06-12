CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target_amount" DECIMAL(14,2) NOT NULL,
    "current_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "goals_title_key" ON "goals"("title");
CREATE INDEX "goals_sort_order_idx" ON "goals"("sort_order");
