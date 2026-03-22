-- CreateTable
CREATE TABLE "treatment_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_templates_tenantId_idx" ON "treatment_templates"("tenantId");
