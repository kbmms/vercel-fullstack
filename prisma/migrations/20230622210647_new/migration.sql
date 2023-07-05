/*
  Warnings:

  - Added the required column `userId` to the `ContaBancaria` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContaBancaria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "saldo" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ContaBancaria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ContaBancaria" ("createdAt", "id", "nome", "saldo") SELECT "createdAt", "id", "nome", "saldo" FROM "ContaBancaria";
DROP TABLE "ContaBancaria";
ALTER TABLE "new_ContaBancaria" RENAME TO "ContaBancaria";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
