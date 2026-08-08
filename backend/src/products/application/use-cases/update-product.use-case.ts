import { Inject, Injectable } from "@nestjs/common";
import { Product } from "../../domain/entities/product.entity";
import { ProductNotFoundError } from "../../domain/errors/product.errors";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../domain/repositories/product.repository";

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  active?: boolean;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number, input: UpdateProductInput): Promise<Product> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError(id);
    }

    if (input.price !== undefined) {
      Product.validatePrice(input.price);
    }
    if (input.stock !== undefined) {
      Product.validateStock(input.stock);
    }

    const updated = new Product({
      id: existing.id,
      name: input.name ?? existing.name,
      description:
        input.description !== undefined
          ? input.description
          : existing.description,
      price: input.price ?? existing.price,
      stock: input.stock ?? existing.stock,
      active: input.active !== undefined ? input.active : existing.active,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    return this.productRepository.update(id, {
      name: updated.name,
      description: updated.description,
      price: updated.price,
      stock: updated.stock,
      active: updated.active,
    });
  }
}
