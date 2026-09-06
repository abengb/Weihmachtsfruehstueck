-- CreateEnum
CREATE TYPE "EiArt" AS ENUM ('KEINS', 'WEICH', 'WACHSWEICH', 'HART', 'RUEHREI', 'SPIEGELEI', 'POCHIERT');

-- CreateEnum
CREATE TYPE "EiGroesse" AS ENUM ('S', 'M', 'L', 'XL');

-- CreateEnum
CREATE TYPE "EiTemperatur" AS ENUM ('KUEHLSCHRANK', 'ZIMMER');

-- CreateEnum
CREATE TYPE "FrageTyp" AS ENUM ('SINGLE', 'MULTI');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "eventCode" TEXT NOT NULL,
    "hostKey" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bruchReserve" INTEGER NOT NULL DEFAULT 2,
    "zeitWeich" INTEGER NOT NULL DEFAULT 270,
    "zeitWachsweich" INTEGER NOT NULL DEFAULT 390,
    "zeitHart" INTEGER NOT NULL DEFAULT 570,
    "zuschlagKuehl" INTEGER NOT NULL DEFAULT 60,
    "zuschlagS" INTEGER NOT NULL DEFAULT -30,
    "zuschlagL" INTEGER NOT NULL DEFAULT 30,
    "zuschlagXL" INTEGER NOT NULL DEFAULT 60,
    "topfKapazitaet" INTEGER NOT NULL DEFAULT 12,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggOrder" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 1,
    "art" "EiArt" NOT NULL,
    "groesse" "EiGroesse" NOT NULL DEFAULT 'M',
    "temperatur" "EiTemperatur" NOT NULL DEFAULT 'KUEHLSCHRANK',
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "typ" "FrageTyp" NOT NULL DEFAULT 'SINGLE',
    "optionen" TEXT[],
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "auswahl" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wunsch" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wunsch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventCode_key" ON "Event"("eventCode");

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_eventId_name_key" ON "Guest"("eventId", "name");

-- CreateIndex
CREATE INDEX "EggOrder_guestId_idx" ON "EggOrder"("guestId");

-- CreateIndex
CREATE INDEX "Question_eventId_idx" ON "Question"("eventId");

-- CreateIndex
CREATE INDEX "Answer_guestId_idx" ON "Answer"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_guestId_key" ON "Answer"("questionId", "guestId");

-- CreateIndex
CREATE INDEX "Wunsch_guestId_idx" ON "Wunsch"("guestId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggOrder" ADD CONSTRAINT "EggOrder_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wunsch" ADD CONSTRAINT "Wunsch_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
