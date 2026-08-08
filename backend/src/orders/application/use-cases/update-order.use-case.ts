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
import { OrderNotFoundError } from "../../domain/errors/order.errors";
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from "../../domain/repositories/order.repository";
import { CreateOrderItemInput } from "./create-order.use-case";

export interface UpdateOrderInput {
  customerName?: string;
  items?: CreateOrderItemInput[];
}

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number, input: UpdateOrderInput): Promise<Order> {
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new OrderNotFoundError(id);
    }

    let updatedItems = existingOrder.items;
    if (input.items && input.items.length > 0) {
      const productIds = input.items.map((i) => i.productId);
      const products = await this.productRepository.findByIds(productIds);
      const productMap = new Map(products.map((p) => [p.id!, p]));

      updatedItems = input.items.map((itemInput) => {
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
    }

    const updatedCustomerName =
      input.customerName ?? existingOrder.customerName;

    existingOrder.updateDetails(updatedCustomerName, updatedItems);
    return this.orderRepository.update(existingOrder);
  }
}
