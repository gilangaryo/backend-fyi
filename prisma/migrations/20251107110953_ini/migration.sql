-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` TEXT NULL,
    `role` ENUM('ADMIN', 'USER', 'VENDOR', 'EMPLOYEE') NOT NULL DEFAULT 'USER',
    `refreshToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DECIMAL(18, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,
    `delivery` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `collectionId` VARCHAR(191) NULL,
    `kainId` VARCHAR(191) NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_collectionId_idx`(`collectionId`),
    INDEX `Product_createdAt_idx`(`createdAt`),
    INDEX `Product_price_idx`(`price`),
    INDEX `Product_kainId_idx`(`kainId`),
    INDEX `Product_stock_idx`(`stock`),
    INDEX `Product_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NULL,
    `bust` VARCHAR(191) NULL,
    `waist` VARCHAR(191) NULL,
    `length` VARCHAR(191) NULL,
    `sleeve` VARCHAR(191) NULL,
    `height` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kain` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Kain_name_key`(`name`),
    UNIQUE INDEX `Kain_slug_key`(`slug`),
    INDEX `Kain_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `subDescription` TEXT NULL,
    `quote` TEXT NOT NULL,
    `heroImage` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Collection_slug_key`(`slug`),
    INDEX `Collection_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NOT NULL,
    `paymentRequestId` VARCHAR(191) NOT NULL,
    `paymentLinkUrl` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `expiredAt` DATETIME(3) NULL,

    UNIQUE INDEX `Payment_referenceId_key`(`referenceId`),
    UNIQUE INDEX `Payment_paymentRequestId_key`(`paymentRequestId`),
    INDEX `Payment_userId_idx`(`userId`),
    INDEX `Payment_orderId_idx`(`orderId`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `refundRequestId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Refund_refundRequestId_key`(`refundRequestId`),
    INDEX `Refund_paymentId_idx`(`paymentId`),
    INDEX `Refund_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'NEW', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `total` DECIMAL(18, 2) NOT NULL,
    `shippingCost` DECIMAL(18, 2) NULL,
    `subTotal` DECIMAL(18, 2) NOT NULL,
    `xenditPaymentId` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `bytestepShipmentId` VARCHAR(191) NULL,
    `shippingAddressId` VARCHAR(191) NULL,
    `courierCompany` VARCHAR(191) NULL,
    `discountId` VARCHAR(191) NULL,
    `giftNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `priceAtPurchase` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `variantId` VARCHAR(191) NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusLog` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'NEW', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'EXPIRED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderStatusLog_orderId_idx`(`orderId`),
    INDEX `OrderStatusLog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `addressDetails` TEXT NULL,
    `city` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ShippingAddress_userId_idx`(`userId`),
    INDEX `ShippingAddress_city_idx`(`city`),
    INDEX `ShippingAddress_province_idx`(`province`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShipmentTracking` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `courier` VARCHAR(191) NOT NULL,
    `trackingId` VARCHAR(191) NOT NULL,
    `waybillId` VARCHAR(191) NULL,
    `trackingLink` VARCHAR(191) NULL,
    `estimatedDelivery` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ShipmentTracking_orderId_idx`(`orderId`),
    INDEX `ShipmentTracking_courier_idx`(`courier`),
    INDEX `ShipmentTracking_trackingId_idx`(`trackingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Discount` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENT', 'VALUE') NOT NULL,
    `value` DECIMAL(18, 2) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `minimumOrderAmount` DECIMAL(18, 2) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Discount_code_key`(`code`),
    INDEX `Discount_code_idx`(`code`),
    INDEX `Discount_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog` (
    `id` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `heroImage` VARCHAR(191) NULL,
    `firstHeaderImage` VARCHAR(191) NULL,
    `firstHeading` VARCHAR(191) NULL,
    `firstDescription` TEXT NULL,
    `secondHeaderImage` VARCHAR(191) NULL,
    `secondHeading` VARCHAR(191) NULL,
    `secondDescription` TEXT NULL,
    `thirdHeaderImage` VARCHAR(191) NULL,
    `thirdHeading` VARCHAR(191) NULL,
    `thirdDescription` TEXT NULL,
    `thirdSubDescription` TEXT NULL,
    `imageDivider` VARCHAR(191) NULL,
    `quote` TEXT NULL,
    `firstFooterImage` VARCHAR(191) NULL,
    `secondFooterImage` VARCHAR(191) NULL,
    `fourthHeaderImage` VARCHAR(191) NULL,
    `fourthHeading` VARCHAR(191) NULL,
    `fourthDescription` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Blog_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `subscribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unsubscribedAt` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `Subscriber_email_key`(`email`),
    INDEX `Subscriber_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_kainId_fkey` FOREIGN KEY (`kainId`) REFERENCES `Kain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_shippingAddressId_fkey` FOREIGN KEY (`shippingAddressId`) REFERENCES `ShippingAddress`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `Discount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusLog` ADD CONSTRAINT `OrderStatusLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShippingAddress` ADD CONSTRAINT `ShippingAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShipmentTracking` ADD CONSTRAINT `ShipmentTracking_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
