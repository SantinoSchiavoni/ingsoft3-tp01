import { Module } from "@nestjs/common";
import { CreateProductUseCase } from "./application/use-cases/create-product.use-case";
import { DeactivateProductUseCase } from "./application/use-cases/deactivate-product.use-case";
import { GetProductByIdUseCase } from "./application/use-cases/get-product-by-id.use-case";
import { GetProductsUseCase } from "./application/use-cases/get-products.use-case";
import { UpdateProductUseCase } from "./application/use-cases/update-product.use-case";
import { PRODUCT_REPOSITORY } from "./domain/repositories/product.repository";
import { PrismaProductRepository } from "./infrastructure/persistence/prisma/prisma-product.repository";
import { ProductsController } from "./presentation/controllers/products.controller";

@Module({
  controllers: [ProductsController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    GetProductsUseCase,
    GetProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeactivateProductUseCase,
  ],
  exports: [PRODUCT_REPOSITORY, GetProductByIdUseCase],
})
export class ProductsModule {}
