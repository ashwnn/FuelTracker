-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `defaultDistanceUnit` ENUM('KM', 'MILE') NOT NULL DEFAULT 'KM',
    `defaultVolumeUnit` ENUM('LITER', 'GALLON') NOT NULL DEFAULT 'LITER',
    `defaultEconomyUnit` ENUM('L_PER_100KM', 'MPG') NOT NULL DEFAULT 'L_PER_100KM',
    `defaultCurrency` VARCHAR(191) NOT NULL DEFAULT 'CAD',

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `keyHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ApiKey_userId_idx`(`userId`),
    INDEX `ApiKey_keyHash_idx`(`keyHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyBudget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MonthlyBudget_userId_idx`(`userId`),
    UNIQUE INDEX `MonthlyBudget_userId_year_month_key`(`userId`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vehicle_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TankProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fuelType` ENUM('REGULAR', 'PREMIUM', 'DIESEL', 'E85', 'OTHER') NOT NULL,
    `capacityL` DECIMAL(8, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TankProfile_vehicleId_idx`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FillUpEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `tankId` INTEGER NULL,
    `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `odometerKm` DECIMAL(10, 2) NOT NULL,
    `fuelVolumeL` DECIMAL(8, 3) NOT NULL,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'CAD',
    `pricePerLiter` DECIMAL(10, 4) NULL,
    `fuelType` ENUM('REGULAR', 'PREMIUM', 'DIESEL', 'E85', 'OTHER') NOT NULL,
    `fillLevel` ENUM('FULL', 'PARTIAL') NOT NULL DEFAULT 'FULL',
    `sourceType` ENUM('MANUAL', 'PHOTO_AI', 'API') NOT NULL DEFAULT 'MANUAL',
    `imageUrl` TEXT NULL,
    `aiConfidence` DOUBLE NULL,
    `distanceSinceLastKm` DECIMAL(10, 2) NULL,
    `economyLPer100Km` DECIMAL(8, 3) NULL,
    `economyMpg` DECIMAL(8, 3) NULL,
    `costPerKm` DECIMAL(10, 4) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FillUpEntry_vehicleId_entryDate_idx`(`vehicleId`, `entryDate`),
    INDEX `FillUpEntry_userId_entryDate_idx`(`userId`, `entryDate`),
    INDEX `FillUpEntry_tankId_idx`(`tankId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyBudget` ADD CONSTRAINT `MonthlyBudget_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TankProfile` ADD CONSTRAINT `TankProfile_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FillUpEntry` ADD CONSTRAINT `FillUpEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FillUpEntry` ADD CONSTRAINT `FillUpEntry_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FillUpEntry` ADD CONSTRAINT `FillUpEntry_tankId_fkey` FOREIGN KEY (`tankId`) REFERENCES `TankProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
