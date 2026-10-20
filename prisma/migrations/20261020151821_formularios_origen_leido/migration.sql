-- CreateEnum
CREATE TYPE "OrigenFormulario" AS ENUM ('contacto', 'solicitud_registro');

-- AlterTable
ALTER TABLE "ContactForm" ADD COLUMN     "leido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "origen" "OrigenFormulario" NOT NULL DEFAULT 'contacto';

-- AlterTable
ALTER TABLE "CotizationForm" ADD COLUMN     "leido" BOOLEAN NOT NULL DEFAULT false;
