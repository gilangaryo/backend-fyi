-- AlterTable
ALTER TABLE `blog` MODIFY `description` TEXT NOT NULL,
    MODIFY `firstDescription` TEXT NULL,
    MODIFY `secondDescription` TEXT NULL,
    MODIFY `thirdDescription` TEXT NULL,
    MODIFY `fourthDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `collection` MODIFY `quote` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `shippingaddress` MODIFY `address` TEXT NOT NULL,
    MODIFY `addressDetails` TEXT NULL;
