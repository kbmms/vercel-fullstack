/*
  Warnings:

  - You are about to drop the column `userId` on the `Category` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "estimatedValue" REAL NOT NULL DEFAULT 0.0
);
INSERT INTO "new_Category" ("estimatedValue", "id", "label", "value") SELECT "estimatedValue", "id", "label", "value" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
