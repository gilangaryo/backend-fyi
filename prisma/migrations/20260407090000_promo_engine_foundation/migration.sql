-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `discountTotal` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `pricingBreakdown` JSON NULL;

-- AlterTable
ALTER TABLE `Discount`
    ADD COLUMN `kind` ENUM('COLLECTION_DISCOUNT', 'SPECIFIC_PRODUCT_DISCOUNT', 'MINIMUM_PURCHASE_DISCOUNT', 'MINIMUM_QTY_DISCOUNT') NOT NULL DEFAULT 'MINIMUM_PURCHASE_DISCOUNT',
    ADD COLUMN `startsAt` DATETIME(3) NULL,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN `minimumQty` INTEGER NULL,
    ADD COLUMN `combinableWith` JSON NULL,
    ADD COLUMN `autoApply` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `DiscountCollectionTarget` (
    `id` VARCHAR(191) NOT NULL,
    `discountId` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DiscountCollectionTarget_discountId_collectionId_key`(`discountId`, `collectionId`),
    INDEX `DiscountCollectionTarget_discountId_idx`(`discountId`),
    INDEX `DiscountCollectionTarget_collectionId_idx`(`collectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscountProductTarget` (
    `id` VARCHAR(191) NOT NULL,
    `discountId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DiscountProductTarget_discountId_productId_key`(`discountId`, `productId`),
    INDEX `DiscountProductTarget_discountId_idx`(`discountId`),
    INDEX `DiscountProductTarget_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Discount_kind_idx` ON `Discount`(`kind`);

-- CreateIndex
CREATE INDEX `Discount_startsAt_idx` ON `Discount`(`startsAt`);

-- AddForeignKey
ALTER TABLE `DiscountCollectionTarget`
    ADD CONSTRAINT `DiscountCollectionTarget_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `Discount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountCollectionTarget`
    ADD CONSTRAINT `DiscountCollectionTarget_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountProductTarget`
    ADD CONSTRAINT `DiscountProductTarget_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `Discount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountProductTarget`
    ADD CONSTRAINT `DiscountProductTarget_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;