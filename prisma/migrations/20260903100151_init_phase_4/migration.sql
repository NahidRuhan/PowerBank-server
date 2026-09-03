-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'REPAIRING', 'RESOLVED');

-- CreateTable
CREATE TABLE "OutageIncident" (
    "id" TEXT NOT NULL,
    "feederId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "estimatedRestoration" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutageIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutageIncident_feederId_idx" ON "OutageIncident"("feederId");

-- CreateIndex
CREATE INDEX "OutageIncident_status_idx" ON "OutageIncident"("status");

-- AddForeignKey
ALTER TABLE "OutageIncident" ADD CONSTRAINT "OutageIncident_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "Feeder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutageIncident" ADD CONSTRAINT "OutageIncident_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
