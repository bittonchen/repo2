/*
  Warnings:

  - Made the column `idNumber` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ALTER COLUMN "idNumber" SET NOT NULL;
