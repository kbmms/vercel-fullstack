-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "estimatedValue" REAL NOT NULL DEFAULT 0.0
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");
