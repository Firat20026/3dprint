-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceTRY" DECIMAL(10,2) NOT NULL,
    "oldPriceTRY" DECIMAL(10,2),
    "imageUrl" TEXT,
    "imagesJson" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT,
    "buyUrl" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogProduct_isActive_featured_idx" ON "CatalogProduct"("isActive", "featured");

-- CreateIndex
CREATE INDEX "CatalogProduct_isActive_sortOrder_idx" ON "CatalogProduct"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogProduct_category_idx" ON "CatalogProduct"("category");
