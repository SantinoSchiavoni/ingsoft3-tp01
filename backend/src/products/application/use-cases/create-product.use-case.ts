import { Inject, Injectable } from "@nestjs/common";
import { Product } from "../../domain/entities/product.entity";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../domain/repositories/product.repository";

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const product = new Product({
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      active: true,
    });

    return this.productRepository.save(product);
  }
}
