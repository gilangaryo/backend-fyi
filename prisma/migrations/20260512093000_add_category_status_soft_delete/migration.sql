-- AlterTable
ALTER TABLE `Category`
ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing rows as active
UPDATE `Category`
SET `status` = true
WHERE `status` IS NULL;
