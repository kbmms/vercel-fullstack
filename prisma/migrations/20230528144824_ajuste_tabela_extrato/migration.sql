-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExtratoBancario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "contaBancariaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'entrada',
    CONSTRAINT "ExtratoBancario_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExtratoBancario" ("contaBancariaId", "data", "descricao", "id", "valor") SELECT "contaBancariaId", "data", "descricao", "id", "valor" FROM "ExtratoBancario";
DROP TABLE "ExtratoBancario";
ALTER TABLE "new_ExtratoBancario" RENAME TO "ExtratoBancario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
