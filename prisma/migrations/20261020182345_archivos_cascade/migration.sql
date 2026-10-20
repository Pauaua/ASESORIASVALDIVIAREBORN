-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_resourceId_fkey";

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
