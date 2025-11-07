-- AlterTable
ALTER TABLE `shipmenttracking` ADD COLUMN `trackingLink` VARCHAR(191) NULL,
    ADD COLUMN `waybillId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ShipmentTracking_trackingId_idx` ON `ShipmentTracking`(`trackingId`);
