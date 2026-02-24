-- AlterTable
ALTER TABLE `payment` ADD COLUMN `provider` ENUM('MIDTRANS', 'XENDIT') NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `details` TEXT NULL,
    MODIFY `delivery` TEXT NULL;
