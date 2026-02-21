-- Convert phase from enum to plain text so phases are managed at the app level

-- First convert column from enum to text
ALTER TABLE "Retro" ALTER COLUMN "phase" SET DATA TYPE TEXT;

-- Map old phase values to new consolidated phases
UPDATE "Retro" SET "phase" = 'RETROSPECT' WHERE "phase" = 'BRAINSTORM';
UPDATE "Retro" SET "phase" = 'GROUP_VOTE' WHERE "phase" IN ('GROUP', 'VOTE');
UPDATE "Retro" SET "phase" = 'DISCUSS_ACTION' WHERE "phase" IN ('DISCUSS', 'ACTION_ITEMS');

-- Update default
ALTER TABLE "Retro" ALTER COLUMN "phase" SET DEFAULT 'ICEBREAKER';

-- Drop the enum type
DROP TYPE "RetroPhase";
