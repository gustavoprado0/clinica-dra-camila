-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL,
    "openHour" INTEGER NOT NULL DEFAULT 8,
    "closeHour" INTEGER NOT NULL DEFAULT 19,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "weekdays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);
