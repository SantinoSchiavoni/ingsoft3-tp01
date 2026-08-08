import { OrderStatus } from "../enums/order-status.enum";

import {
  DuplicateProductInOrderError,
  EmptyOrderError,
  InvalidCustomerNameError,
  InvalidOrderStateTransitionError,
  OrderCannotBeModifiedError,
} from "../errors/order.errors";

import { OrderItem } from "./order-item.entity";

export interface OrderProps {
  id?: number;
  customerName: string;
  status?: OrderStatus;
  items: OrderItem[];
  total?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  readonly id?: number;
  private _customerName: string;
  private _status: OrderStatus;
  private _items: OrderItem[] = [];
  private _total: number;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: OrderProps) {
    this._customerName = Order.validateCustomerName(props.customerName);
    this._status = props.status ?? OrderStatus.PENDING;
    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    this._items = [];
    this.validateAndSetItems(props.items);
    this._total = Order.calculateTotal(this._items);
  }

  get customerName(): string {
    return this._customerName;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get items(): OrderItem[] {
    return [...this._items];
  }

  get total(): number {
    return this._total;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  static validateCustomerName(name: string): string {
    if (!name) {
      throw new InvalidCustomerNameError("Customer name is required");
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new InvalidCustomerNameError(
        "Customer name must be at least 2 characters long",
      );
    }
    if (trimmed.length > 100) {
      throw new InvalidCustomerNameError(
        "Customer name cannot exceed 100 characters",
      );
    }
    return trimmed;
  }

  private validateAndSetItems(items: OrderItem[]): void {
    if (!items || items.length === 0) {
      throw new EmptyOrderError();
    }

    const seenProductIds = new Set<number>();
    for (const item of items) {
      if (seenProductIds.has(item.productId)) {
        throw new DuplicateProductInOrderError(item.productId);
      }
      seenProductIds.add(item.productId);
    }

    this._items = items;
  }

  static calculateTotal(items: OrderItem[]): number {
    const sum = items.reduce((acc, item) => acc + item.subtotal, 0);
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }

  updateDetails(customerName: string, items: OrderItem[]): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new OrderCannotBeModifiedError(this._status);
    }

    this._customerName = Order.validateCustomerName(customerName);
    this.validateAndSetItems(items);
    this._total = Order.calculateTotal(this._items);
    this._updatedAt = new Date();
  }

  confirm(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new InvalidOrderStateTransitionError(
        this._status,
        OrderStatus.CONFIRMED,
      );
    }
    this._status = OrderStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  startPreparing(): void {
    if (this._status !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStateTransitionError(
        this._status,
        OrderStatus.PREPARING,
      );
    }
    this._status = OrderStatus.PREPARING;
    this._updatedAt = new Date();
  }

  deliver(): void {
    if (this._status !== OrderStatus.PREPARING) {
      throw new InvalidOrderStateTransitionError(
        this._status,
        OrderStatus.DELIVERED,
      );
    }
    this._status = OrderStatus.DELIVERED;
    this._updatedAt = new Date();
  }

  cancel(): { wasConfirmed: boolean } {
    if (
      this._status !== OrderStatus.PENDING &&
      this._status !== OrderStatus.CONFIRMED
    ) {
      throw new InvalidOrderStateTransitionError(
        this._status,
        OrderStatus.CANCELLED,
      );
    }

    const wasConfirmed = this._status === OrderStatus.CONFIRMED;
    this._status = OrderStatus.CANCELLED;
    this._updatedAt = new Date();

    return { wasConfirmed };
  }

  toJSON() {
    return {
      id: this.id,
      customerName: this._customerName,
      status: this._status,
      total: this._total,
      items: this._items.map((item) => (item.toJSON ? item.toJSON() : item)),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
