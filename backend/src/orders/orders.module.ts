import { Module } from "@nestjs/common";
import { ProductsModule } from "../products/products.module";
import { CancelOrderUseCase } from "./application/use-cases/cancel-order.use-case";
import { ConfirmOrderUseCase } from "./application/use-cases/confirm-order.use-case";
import { CreateOrderUseCase } from "./application/use-cases/create-order.use-case";
import { DeliverOrderUseCase } from "./application/use-cases/deliver-order.use-case";
import { GetOrderByIdUseCase } from "./application/use-cases/get-order-by-id.use-case";
import { GetOrdersUseCase } from "./application/use-cases/get-orders.use-case";
import { StartPreparingOrderUseCase } from "./application/use-cases/start-preparing-order.use-case";
import { UpdateOrderUseCase } from "./application/use-cases/update-order.use-case";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma/prisma-order.repository";
import { OrdersController } from "./presentation/controllers/orders.controller";

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    GetOrdersUseCase,
    GetOrderByIdUseCase,
    CreateOrderUseCase,
    UpdateOrderUseCase,
    ConfirmOrderUseCase,
    StartPreparingOrderUseCase,
    DeliverOrderUseCase,
    CancelOrderUseCase,
  ],
  exports: [
    ORDER_REPOSITORY,
    GetOrdersUseCase,
    GetOrderByIdUseCase,
    CreateOrderUseCase,
    ConfirmOrderUseCase,
    CancelOrderUseCase,
  ],
})
export class OrdersModule {}
