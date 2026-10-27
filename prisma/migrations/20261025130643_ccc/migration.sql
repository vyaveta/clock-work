/*
  Warnings:

  - A unique constraint covering the columns `[fromNodeId,toNodeId,fromOutput,toInput]` on the table `connection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "connection_fromNodeId_fromOutput_key";

-- DropIndex
DROP INDEX "connection_toNodeId_toInput_key";

-- CreateIndex
CREATE UNIQUE INDEX "connection_fromNodeId_toNodeId_fromOutput_toInput_key" ON "connection"("fromNodeId", "toNodeId", "fromOutput", "toInput");
