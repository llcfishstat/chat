/*
  Warnings:

  - The primary key for the `chatroom_user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `chatrooms` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "chatroom_user" DROP CONSTRAINT "chatroom_user_chatroomId_fkey";

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_chatroomId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chatroomId_fkey";

-- AlterTable
ALTER TABLE "chatroom_user" DROP CONSTRAINT "chatroom_user_pkey",
ALTER COLUMN "chatroomId" SET DATA TYPE TEXT,
ADD CONSTRAINT "chatroom_user_pkey" PRIMARY KEY ("chatroomId", "userId");

-- AlterTable
ALTER TABLE "chatrooms" DROP CONSTRAINT "chatrooms_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "chatrooms_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "chatrooms_id_seq";

-- AlterTable
ALTER TABLE "media" ALTER COLUMN "chatroomId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "chatroomId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_user" ADD CONSTRAINT "chatroom_user_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
