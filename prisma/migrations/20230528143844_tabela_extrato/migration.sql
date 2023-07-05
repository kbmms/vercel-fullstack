-- CreateTable
CREATE TABLE "ExtratoBancario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "contaBancariaId" TEXT NOT NULL,
    CONSTRAINT "ExtratoBancario_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "ContaBancaria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
