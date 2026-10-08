-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameRu" TEXT,
    "nameUz" TEXT,
    "zipFrom" INTEGER NOT NULL,
    "zipTo" INTEGER NOT NULL,
    "deliveryDaysMin" INTEGER NOT NULL,
    "deliveryDaysMax" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL,
    "pickupAvailable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryZone_code_key" ON "DeliveryZone"("code");

-- CreateIndex
CREATE INDEX "DeliveryZone_zipFrom_idx" ON "DeliveryZone"("zipFrom");
