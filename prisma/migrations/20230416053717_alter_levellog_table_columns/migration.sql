-- AlterTable
ALTER TABLE "LevelLog" ADD COLUMN     "idSerial" SERIAL NOT NULL,
ADD COLUMN     "isT0" BOOLEAN NOT NULL DEFAULT false;
