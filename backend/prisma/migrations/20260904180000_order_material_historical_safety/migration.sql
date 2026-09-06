-- DropForeignKey
ALTER TABLE "OrderMaterial" DROP CONSTRAINT "OrderMaterial_materialId_fkey";

-- AddForeignKey
ALTER TABLE "OrderMaterial" ADD CONSTRAINT "OrderMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
