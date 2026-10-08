-- CreateTable
CREATE TABLE "StockNotification" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockNotification_productId_idx" ON "StockNotification"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockNotification_productId_email_key" ON "StockNotification"("productId", "email");

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
