import { InvalidQuantityError } from "../errors/order.errors";

export interface OrderItemProps {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal?: number;
}

export class OrderItem {
  readonly id?: number;
  readonly orderId?: number;
  readonly productId: number;
  readonly productName: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly subtotal: number;

  constructor(props: OrderItemProps) {
    if (props.quantity < 1 || !Number.isInteger(props.quantity)) {
      throw new InvalidQuantityError(props.productId, props.quantity);
    }
    if (props.unitPrice <= 0 || isNaN(props.unitPrice)) {
      throw new Error(
        `Unit price must be positive for product ID ${props.productId}`,
      );
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.productName = props.productName.trim();
    this.unitPrice = OrderItem.roundMoney(props.unitPrice);
    this.quantity = props.quantity;
    this.subtotal =
      props.subtotal !== undefined
        ? OrderItem.roundMoney(props.subtotal)
        : OrderItem.roundMoney(this.unitPrice * this.quantity);
  }

  static roundMoney(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      productName: this.productName,
      unitPrice: this.unitPrice,
      quantity: this.quantity,
      subtotal: this.subtotal,
    };
  }
}
