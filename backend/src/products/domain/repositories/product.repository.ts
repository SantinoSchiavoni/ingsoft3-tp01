import { Product } from "../entities/product.entity";

export interface ProductRepository {
  findById(id: number): Promise<Product | null>;
  findByIds(ids: number[]): Promise<Product[]>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  update(id: number, data: Partial<Omit<Product, "id">>): Promise<Product>;
  deactivate(id: number): Promise<Product>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
