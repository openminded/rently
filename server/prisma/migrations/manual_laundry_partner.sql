-- CreateTable
CREATE TABLE `LaundryPartner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LaundryBatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partnerId` INTEGER NOT NULL,
    `sentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedDate` DATETIME(3) NULL,
    `expense` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referenceId` INTEGER NULL,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `LaundryLog` DROP COLUMN `sentDate`,
    DROP COLUMN `expectedReturnDate`,
    DROP COLUMN `receivedDate`,
    ADD COLUMN `batchId` INTEGER NULL,
    ADD COLUMN `completedDate` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'WAITING';

-- AddForeignKey
ALTER TABLE `LaundryBatch` ADD CONSTRAINT `LaundryBatch_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `LaundryPartner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LaundryLog` ADD CONSTRAINT `LaundryLog_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `LaundryBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
