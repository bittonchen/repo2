-- CreateEnum
CREATE TYPE "LabTestStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "veterinarianId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "testType" TEXT NOT NULL,
    "panelName" TEXT,
    "status" "LabTestStatus" NOT NULL DEFAULT 'pending',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "deviceId" TEXT,
    "deviceName" TEXT,
    "rawData" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_results" (
    "id" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "refMin" DOUBLE PRECISION,
    "refMax" DOUBLE PRECISION,
    "flag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lab_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dicom_studies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "studyInstanceUid" TEXT NOT NULL,
    "studyDate" TIMESTAMP(3),
    "studyDescription" TEXT,
    "modality" TEXT,
    "accessionNumber" TEXT,
    "referringVet" TEXT,
    "orthancStudyId" TEXT,
    "numberOfSeries" INTEGER NOT NULL DEFAULT 0,
    "numberOfInstances" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'received',
    "reportText" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dicom_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dicom_series" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "seriesInstanceUid" TEXT NOT NULL,
    "seriesNumber" INTEGER,
    "seriesDescription" TEXT,
    "modality" TEXT,
    "bodyPart" TEXT,
    "orthancSeriesId" TEXT,
    "numberOfInstances" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dicom_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dicom_instances" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "sopInstanceUid" TEXT NOT NULL,
    "instanceNumber" INTEGER,
    "orthancInstanceId" TEXT,
    "fileUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dicom_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_tests_tenantId_idx" ON "lab_tests"("tenantId");

-- CreateIndex
CREATE INDEX "lab_tests_tenantId_animalId_idx" ON "lab_tests"("tenantId", "animalId");

-- CreateIndex
CREATE INDEX "lab_tests_tenantId_status_idx" ON "lab_tests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lab_test_results_labTestId_idx" ON "lab_test_results"("labTestId");

-- CreateIndex
CREATE UNIQUE INDEX "dicom_studies_studyInstanceUid_key" ON "dicom_studies"("studyInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_studies_tenantId_idx" ON "dicom_studies"("tenantId");

-- CreateIndex
CREATE INDEX "dicom_studies_tenantId_animalId_idx" ON "dicom_studies"("tenantId", "animalId");

-- CreateIndex
CREATE INDEX "dicom_studies_orthancStudyId_idx" ON "dicom_studies"("orthancStudyId");

-- CreateIndex
CREATE UNIQUE INDEX "dicom_series_seriesInstanceUid_key" ON "dicom_series"("seriesInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_series_studyId_idx" ON "dicom_series"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "dicom_instances_sopInstanceUid_key" ON "dicom_instances"("sopInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_instances_seriesId_idx" ON "dicom_instances"("seriesId");

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_results" ADD CONSTRAINT "lab_test_results_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "lab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_studies" ADD CONSTRAINT "dicom_studies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_studies" ADD CONSTRAINT "dicom_studies_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_series" ADD CONSTRAINT "dicom_series_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "dicom_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_instances" ADD CONSTRAINT "dicom_instances_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "dicom_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
