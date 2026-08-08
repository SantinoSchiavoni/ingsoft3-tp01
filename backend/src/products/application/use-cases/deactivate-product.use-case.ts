import { Inject, Injectable } from "@nestjs/common";
import { Product } from "../../domain/entities/product.entity";
import { ProductNotFoundError } from "../../domain/errors/product.errors";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../domain/repositories/product.repository";

@Injectable()
export class DeactivateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }

    return this.productRepository.deactivate(id);
  }
}
