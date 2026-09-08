-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('EMAIL', 'SMS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationMethod" "VerificationMethod";
