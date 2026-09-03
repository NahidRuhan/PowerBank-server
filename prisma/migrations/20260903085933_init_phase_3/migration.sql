-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SheddingQuota" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "targetMW" DOUBLE PRECISION NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheddingQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledOutage" (
    "id" TEXT NOT NULL,
    "feederId" TEXT NOT NULL,
    "quotaId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledOutage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SheddingQuota_date_idx" ON "SheddingQuota"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SheddingQuota_date_timeSlot_key" ON "SheddingQuota"("date", "timeSlot");

-- CreateIndex
CREATE INDEX "ScheduledOutage_feederId_startTime_endTime_idx" ON "ScheduledOutage"("feederId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "ScheduledOutage_status_idx" ON "ScheduledOutage"("status");

-- CreateIndex
CREATE INDEX "ScheduledOutage_quotaId_idx" ON "ScheduledOutage"("quotaId");

-- AddForeignKey
ALTER TABLE "SheddingQuota" ADD CONSTRAINT "SheddingQuota_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledOutage" ADD CONSTRAINT "ScheduledOutage_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "Feeder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledOutage" ADD CONSTRAINT "ScheduledOutage_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "SheddingQuota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledOutage" ADD CONSTRAINT "ScheduledOutage_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
