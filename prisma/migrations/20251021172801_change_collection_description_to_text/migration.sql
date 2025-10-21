-- AlterTable
ALTER TABLE `collection` MODIFY `description` TEXT NOT NULL,
    MODIFY `subDescription` TEXT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `phone` TEXT NULL;
