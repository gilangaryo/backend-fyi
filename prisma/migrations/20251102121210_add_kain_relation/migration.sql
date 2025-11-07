/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Kain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Kain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Kain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `kain` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `kainId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Kain_name_key` ON `Kain`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Kain_slug_key` ON `Kain`(`slug`);

-- CreateIndex
CREATE INDEX `Kain_name_idx` ON `Kain`(`name`);

-- CreateIndex
CREATE INDEX `Product_kainId_idx` ON `Product`(`kainId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_kainId_fkey` FOREIGN KEY (`kainId`) REFERENCES `Kain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
