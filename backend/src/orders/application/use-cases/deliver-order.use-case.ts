import { Inject, Injectable } from "@nestjs/common";
import { Order } from "../../domain/entities/order.entity";
import { OrderNotFoundError } from "../../domain/errors/order.errors";
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from "../../domain/repositories/order.repository";

@Injectable()
export class DeliverOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: number): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    order.deliver();
    return this.orderRepository.update(order);
  }
}
