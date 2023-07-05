-- CreateTable
CREATE TABLE "CategoryUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CategoryUser_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CategoryUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryUser_categoryId_userId_key" ON "CategoryUser"("categoryId", "userId");

-- CreateIndex
CREATE INDEX "unique_value" ON "Category"("value");
