-- CreateEnum
CREATE TYPE "ChatroomType" AS ENUM ('Private', 'Auction');

-- AlterTable
ALTER TABLE "chatrooms" ADD COLUMN     "type" "ChatroomType" NOT NULL DEFAULT 'Private';
