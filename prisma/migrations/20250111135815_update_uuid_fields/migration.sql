/*
  Warnings:

  - The primary key for the `chatroom_user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `userId` on the `chatroom_user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "chatroom_user" DROP CONSTRAINT "chatroom_user_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "chatroom_user_pkey" PRIMARY KEY ("chatroomId", "userId");

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;
