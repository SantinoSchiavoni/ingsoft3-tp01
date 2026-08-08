import {
  InvalidProductPriceError,
  InvalidProductStockError,
} from "../errors/product.errors";

export interface ProductProps {
  id?: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  readonly id?: number;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly stock: number;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ProductProps) {
    Product.validatePrice(props.price);
    Product.validateStock(props.stock);

    const trimmedName = props.name.trim();
    if (!trimmedName) {
      throw new Error("Product name cannot be empty");
    }

    this.id = props.id;
    this.name = trimmedName;
    this.description = props.description ?? null;
    this.price = props.price;
    this.stock = props.stock;
    this.active = props.active ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static validatePrice(price: number): void {
    if (price <= 0 || isNaN(price)) {
      throw new InvalidProductPriceError(price);
    }
  }

  static validateStock(stock: number): void {
    if (stock < 0 || !Number.isInteger(stock)) {
      throw new InvalidProductStockError(stock);
    }
  }

  hasStockFor(requestedQuantity: number): boolean {
    return this.stock >= requestedQuantity;
  }
}
