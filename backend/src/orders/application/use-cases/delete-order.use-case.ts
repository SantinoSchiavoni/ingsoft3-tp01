import { Inject, Injectable } from "@nestjs/common";
import { OrderNotFoundError } from "../../domain/errors/order.errors";
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from "../../domain/repositories/order.repository";

@Injectable()
export class DeleteOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    await this.orderRepository.delete(id);
  }
}
