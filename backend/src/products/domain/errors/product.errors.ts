import { DomainError } from "../../../common/errors/domain.error";

export class ProductNotFoundError extends DomainError {
  readonly code = "PRODUCT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(id: number) {
    super(`Product with ID ${id} was not found`);
  }
}

export class ProductInactiveError extends DomainError {
  readonly code = "PRODUCT_INACTIVE";
  readonly statusCode = 400;

  constructor(id: number, name: string) {
    super(`Product "${name}" (ID ${id}) is inactive and cannot be ordered`);
  }
}

export class InvalidProductPriceError extends DomainError {
  readonly code = "INVALID_PRODUCT_PRICE";
  readonly statusCode = 400;

  constructor(price: number) {
    super(`Product price must be strictly positive (> 0). Received: ${price}`);
  }
}

export class InvalidProductStockError extends DomainError {
  readonly code = "INVALID_PRODUCT_STOCK";
  readonly statusCode = 400;

  constructor(stock: number) {
    super(`Product stock cannot be negative (>= 0). Received: ${stock}`);
  }
}
