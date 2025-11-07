/*
  Warnings:

  - You are about to drop the column `thirdQuote` on the `blog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `blog` DROP COLUMN `thirdQuote`,
    ADD COLUMN `firstFooterImage` VARCHAR(191) NULL,
    ADD COLUMN `quote` VARCHAR(191) NULL,
    ADD COLUMN `secondFooterImage` VARCHAR(191) NULL;
