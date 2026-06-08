-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "providerId" VARCHAR(255),
ADD COLUMN     "status" VARCHAR(50) NOT NULL DEFAULT 'pending';
