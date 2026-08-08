import { Inject, Injectable } from "@nestjs/common";
import { ProductNotFoundError } from "../../../products/domain/errors/product.errors";
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from "../../../products/domain/repositories/product.repository";
import { Order } from "../../domain/entities/order.entity";
import {
  InsufficientStockError,
  OrderNotFoundError,
} from "../../domain/errors/order.errors";
import {
  ORDER_REPOSITORY,
  OrderRepository,
  StockChange,
} from "../../domain/repositories/order.repository";

@Injectable()
export class ConfirmOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }

    order.confirm();

    const productIds = order.items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id!, p]));

    const stockDeductions: StockChange[] = [];

    for (const item of order.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (!product.hasStockFor(item.quantity)) {
        throw new InsufficientStockError(
          product.name,
          item.quantity,
          product.stock,
        );
      }
      stockDeductions.push({
        productId: product.id!,
        quantity: item.quantity,
      });
    }

    return this.orderRepository.confirmWithStockDeduction(
      order,
      stockDeductions,
    );
  }
}
