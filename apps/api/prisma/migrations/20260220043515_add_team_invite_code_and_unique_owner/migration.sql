/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActionItem" ALTER COLUMN "assigneeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "inviteCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Team_ownerId_key" ON "Team"("ownerId");
