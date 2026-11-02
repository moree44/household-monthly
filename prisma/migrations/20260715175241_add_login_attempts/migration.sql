-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_created_at_idx" ON "login_attempts"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_username_created_at_idx" ON "login_attempts"("username", "created_at");
