import { Inject, Injectable } from "@nestjs/common";
import { Order } from "../../domain/entities/order.entity";
import { OrderNotFoundError } from "../../domain/errors/order.errors";
import {
  ORDER_REPOSITORY,
  OrderRepository,
  StockChange,
} from "../../domain/repositories/order.repository";

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: number): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    const { wasConfirmed } = order.cancel();

    if (wasConfirmed) {
      const stockRestorations: StockChange[] = order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      return this.orderRepository.cancelWithStockRestoration(
        order,
        stockRestorations,
      );
    }

    return this.orderRepository.update(order);
  }
}
