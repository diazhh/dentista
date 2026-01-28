/*
  Warnings:

  - You are about to drop the column `file_key` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `documents` table. All the data in the column will be lost.
  - Added the required column `file_path` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "file_key",
DROP COLUMN "file_url",
ADD COLUMN     "file_path" TEXT NOT NULL;
