import { Inject, Injectable } from "@nestjs/common";
import {
  ProductInactiveError,
  ProductNotFoundError,
} from "../../../products/domain/errors/product.errors";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../../products/domain/repositories/product.repository";
import { OrderItem } from "../../domain/entities/order-item.entity";
import { Order } from "../../domain/entities/order.entity";
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from "../../domain/repositories/order.repository";

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  items: CreateOrderItemInput[];
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const productIds = input.items.map((i) => i.productId);
    const products = await this.productRepository.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id!, p]));

    const orderItems: OrderItem[] = input.items.map((itemInput) => {
      const product = productMap.get(itemInput.productId);
      if (!product) {
        throw new ProductNotFoundError(itemInput.productId);
      }
      if (!product.active) {
        throw new ProductInactiveError(product.id!, product.name);
      }

      return new OrderItem({
        productId: product.id!,
        productName: product.name,
        unitPrice: product.price,
        quantity: itemInput.quantity,
      });
    });

    const order = new Order({
      customerName: input.customerName,
      items: orderItems,
    });

    return this.orderRepository.save(order);
  }
}
