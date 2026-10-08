-- The trigram operator classes below come from this extension. It is a trusted
-- extension in PostgreSQL 13 and newer, so the database owner can install it
-- without superuser rights. Prisma cannot express CREATE EXTENSION in the
-- schema, so this line lives here by hand.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_shortDescription_idx" ON "Product" USING GIN ("shortDescription" gin_trgm_ops);
