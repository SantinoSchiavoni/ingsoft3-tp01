import { Order } from "../entities/order.entity";
import { OrderStatus } from "../enums/order-status.enum";

export interface OrderFilterOptions {
  status?: OrderStatus;
  customerName?: string;
}

export interface StockChange {
  productId: number;
  quantity: number;
}

export interface OrderRepository {
  findById(id: number): Promise<Order | null>;
  findAll(filters?: OrderFilterOptions): Promise<Order[]>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  confirmWithStockDeduction(
    order: Order,
    stockDeductions: StockChange[],
  ): Promise<Order>;
  cancelWithStockRestoration(
    order: Order,
    stockRestorations: StockChange[],
  ): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");
