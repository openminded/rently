-- ========================================
-- FIX LAUNDRY LOG TABLE
-- Run this to ensure LaundryLog table exists with correct structure
-- ========================================

-- Create LaundryLog table if not exists
CREATE TABLE IF NOT EXISTS `LaundryLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemInstanceSku` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'WAITING',
    `batchId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key if not exists (ignore error if exists)
-- ALTER TABLE `LaundryLog` ADD CONSTRAINT `LaundryLog_itemInstanceSku_fkey` FOREIGN KEY (`itemInstanceSku`) REFERENCES `ItemInstance`(`sku`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Verify table exists
SELECT 'LaundryLog table ready!' AS Status;
DESCRIBE `LaundryLog`;
