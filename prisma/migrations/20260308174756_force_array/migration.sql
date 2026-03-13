/*
  Warnings:

  - The `referencias` column on the `TrabalhoAcademico` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TrabalhoAcademico" DROP COLUMN "referencias",
ADD COLUMN     "referencias" TEXT[];
