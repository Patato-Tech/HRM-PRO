/*
  Warnings:

  - Added the required column `updatedAt` to the `ShiftSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `shiftschedule` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ALTER COLUMN `name` DROP DEFAULT;
