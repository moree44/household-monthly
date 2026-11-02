-- CreateTable
CREATE TABLE "catat_memories" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catat_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catat_chat_turns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catat_chat_turns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catat_memories_term_kind_key" ON "catat_memories"("term", "kind");

-- CreateIndex
CREATE INDEX "catat_memories_kind_idx" ON "catat_memories"("kind");

-- CreateIndex
CREATE INDEX "catat_chat_turns_user_id_created_at_idx" ON "catat_chat_turns"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "catat_memories" ADD CONSTRAINT "catat_memories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catat_chat_turns" ADD CONSTRAINT "catat_chat_turns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
