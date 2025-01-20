-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('Pending', 'Sent', 'DeliveredToCloud', 'DeliveredToDevice', 'Seen');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'Pending';
