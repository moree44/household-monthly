-- Faster dashboard, history, and wallet balance lookups as transaction data grows.
CREATE INDEX "transactions_deleted_at_transaction_date_idx" ON "transactions"("deleted_at", "transaction_date");
CREATE INDEX "transactions_type_deleted_at_transaction_date_idx" ON "transactions"("type", "deleted_at", "transaction_date");
CREATE INDEX "transactions_wallet_id_deleted_at_idx" ON "transactions"("wallet_id", "deleted_at");
CREATE INDEX "transactions_from_wallet_id_deleted_at_idx" ON "transactions"("from_wallet_id", "deleted_at");
CREATE INDEX "transactions_to_wallet_id_deleted_at_idx" ON "transactions"("to_wallet_id", "deleted_at");
CREATE INDEX "transactions_category_id_deleted_at_transaction_date_idx" ON "transactions"("category_id", "deleted_at", "transaction_date");
