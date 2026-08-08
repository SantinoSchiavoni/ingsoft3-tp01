import { Injectable } from "@nestjs/common";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { OrderItem } from "../../../domain/entities/order-item.entity";
import { Order } from "../../../domain/entities/order.entity";
import { OrderStatus } from "../../../domain/enums/order-status.enum";
import {
  OrderFilterOptions,
  OrderRepository,
  StockChange,
} from "../../../domain/repositories/order.repository";

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToDomain(raw: any): Order {
    const items = raw.items.map(
      (item: {
        id: number;
        orderId: number;
        productId: number;
        productName: string;
        unitPrice: { toNumber: () => number };
        quantity: number;
        subtotal: { toNumber: () => number };
      }) =>
        new OrderItem({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice.toNumber(),
          quantity: item.quantity,
          subtotal: item.subtotal.toNumber(),
        }),
    );

    return new Order({
      id: raw.id,
      customerName: raw.customerName,
      status: raw.status as OrderStatus,
      total: raw.total.toNumber(),
      items,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: number): Promise<Order | null> {
    const raw = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return raw ? this.mapToDomain(raw) : null;
  }

  async findAll(filters?: OrderFilterOptions): Promise<Order[]> {
    const where: {
      status?: PrismaOrderStatus;
      customerName?: { contains: string; mode: "insensitive" };
    } = {};
    if (filters?.status) {
      where.status = filters.status as PrismaOrderStatus;
    }
    if (filters?.customerName) {
      where.customerName = {
        contains: filters.customerName,
        mode: "insensitive",
      };
    }

    const rawOrders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return rawOrders.map((raw) => this.mapToDomain(raw));
  }

  async save(order: Order): Promise<Order> {
    const created = await this.prisma.order.create({
      data: {
        customerName: order.customerName,
        status: order.status as PrismaOrderStatus,
        total: order.total,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    return this.mapToDomain(created);
  }

  async update(order: Order): Promise<Order> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });

      return tx.order.update({
        where: { id: order.id },
        data: {
          customerName: order.customerName,
          status: order.status as PrismaOrderStatus,
          total: order.total,
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });
    });

    return this.mapToDomain(updated);
  }

  async confirmWithStockDeduction(
    order: Order,
    stockDeductions: StockChange[],
  ): Promise<Order> {
    const result = await this.prisma.$transaction(async (tx) => {
      for (const deduction of stockDeductions) {
        await tx.product.update({
          where: { id: deduction.productId },
          data: {
            stock: {
              decrement: deduction.quantity,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: order.status as PrismaOrderStatus,
        },
        include: { items: true },
      });
    });

    return this.mapToDomain(result);
  }

  async cancelWithStockRestoration(
    order: Order,
    stockRestorations: StockChange[],
  ): Promise<Order> {
    const result = await this.prisma.$transaction(async (tx) => {
      for (const restoration of stockRestorations) {
        await tx.product.update({
          where: { id: restoration.productId },
          data: {
            stock: {
              increment: restoration.quantity,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: order.status as PrismaOrderStatus,
        },
        include: { items: true },
      });
    });

    return this.mapToDomain(result);
  }
}
