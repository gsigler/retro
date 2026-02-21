-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ActionItem_retroId_position_idx" ON "ActionItem"("retroId", "position");
