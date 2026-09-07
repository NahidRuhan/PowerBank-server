-- CreateTable
CREATE TABLE "Meter" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meter_number_key" ON "Meter"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Meter_userId_key" ON "Meter"("userId");

-- CreateIndex
CREATE INDEX "Meter_areaId_idx" ON "Meter"("areaId");

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
