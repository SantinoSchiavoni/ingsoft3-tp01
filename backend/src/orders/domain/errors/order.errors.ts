import { DomainError } from "../../../common/errors/domain.error";
import { OrderStatus } from "../enums/order-status.enum";

export class OrderNotFoundError extends DomainError {
  readonly code = "ORDER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(id: number) {
    super(`Order with ID ${id} was not found`);
  }
}

export class EmptyOrderError extends DomainError {
  readonly code = "EMPTY_ORDER";
  readonly statusCode = 400;

  constructor() {
    super("An order must contain at least one product item");
  }
}

export class InvalidQuantityError extends DomainError {
  readonly code = "INVALID_QUANTITY";
  readonly statusCode = 400;

  constructor(productId: number, quantity: number) {
    super(
      `Product quantity must be an integer greater than or equal to 1. Product ID ${productId} had quantity ${quantity}`,
    );
  }
}

export class DuplicateProductInOrderError extends DomainError {
  readonly code = "DUPLICATED_PRODUCT";
  readonly statusCode = 400;

  constructor(productId: number) {
    super(
      `Product ID ${productId} is duplicated in order items. Consolidate into a single line item with increased quantity.`,
    );
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = "INSUFFICIENT_STOCK";
  readonly statusCode = 409;

  constructor(productName: string, requested: number, available: number) {
    super(
      `Insufficient stock for product "${productName}". Requested: ${requested}, Available: ${available}`,
    );
  }
}

export class InvalidOrderStateTransitionError extends DomainError {
  readonly code = "INVALID_ORDER_TRANSITION";
  readonly statusCode = 409;

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order state from "${from}" to "${to}"`);
  }
}

export class OrderCannotBeModifiedError extends DomainError {
  readonly code = "ORDER_CANNOT_BE_MODIFIED";
  readonly statusCode = 409;

  constructor(status: OrderStatus) {
    super(
      `Order items and customer details can only be modified while state is PENDING. Current state is "${status}"`,
    );
  }
}

export class InvalidCustomerNameError extends DomainError {
  readonly code = "INVALID_CUSTOMER_NAME";
  readonly statusCode = 400;

  constructor(reason: string) {
    super(`Invalid customer name: ${reason}`);
  }
}
