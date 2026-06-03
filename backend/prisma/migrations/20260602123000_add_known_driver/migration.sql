-- CreateTable
CREATE TABLE "KnownDriver" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fullName" TEXT,
    "licensePlate" TEXT NOT NULL,
    "vehiclePhoto" TEXT NOT NULL,
    "driverPhoto" TEXT NOT NULL,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnownDriver_pkey" PRIMARY KEY ("id")
);
