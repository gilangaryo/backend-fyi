-- AlterTable
ALTER TABLE `shippingaddress` ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `village` VARCHAR(191) NULL,
    MODIFY `city` VARCHAR(191) NULL,
    MODIFY `province` VARCHAR(191) NULL,
    MODIFY `postalCode` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;
