import { Inject, Injectable } from "@nestjs/common";
import { Order } from "../../domain/entities/order.entity";
import {
  ORDER_REPOSITORY,
  OrderFilterOptions,
  OrderRepository,
} from "../../domain/repositories/order.repository";

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(filters?: OrderFilterOptions): Promise<Order[]> {
    return this.orderRepository.findAll(filters);
  }
}
