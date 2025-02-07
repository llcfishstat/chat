/*
  Warnings:

  - The values [Auction] on the enum `ChatroomType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChatroomType_new" AS ENUM ('Private', 'Company');
ALTER TABLE "chatrooms" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "chatrooms" ALTER COLUMN "type" TYPE "ChatroomType_new" USING ("type"::text::"ChatroomType_new");
ALTER TYPE "ChatroomType" RENAME TO "ChatroomType_old";
ALTER TYPE "ChatroomType_new" RENAME TO "ChatroomType";
DROP TYPE "ChatroomType_old";
ALTER TABLE "chatrooms" ALTER COLUMN "type" SET DEFAULT 'Private';
COMMIT;

-- AlterTable
ALTER TABLE "chatrooms" ADD COLUMN     "companyId" TEXT;
