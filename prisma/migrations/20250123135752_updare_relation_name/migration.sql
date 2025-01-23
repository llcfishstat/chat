/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `chatroom_media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chatroom_media" DROP CONSTRAINT "chatroom_media_chatroomId_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "imageUrl";

-- DropTable
DROP TABLE "chatroom_media";

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "chatroomId" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
