/*
  Warnings:

  - You are about to drop the column `month` on the `MonthlyBudget` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `MonthlyBudget` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `MonthlyBudget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `MonthlyBudget_userId_year_month_key` ON `MonthlyBudget`;

-- AlterTable
ALTER TABLE `MonthlyBudget` DROP COLUMN `month`,
    DROP COLUMN `year`,
    MODIFY `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE UNIQUE INDEX `MonthlyBudget_userId_key` ON `MonthlyBudget`(`userId`);
