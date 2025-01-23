-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('Photo', 'Video', 'File');

-- CreateTable
CREATE TABLE "chatroom_media" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "chatroomId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatroom_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chatroom_media" ADD CONSTRAINT "chatroom_media_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "chatrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
