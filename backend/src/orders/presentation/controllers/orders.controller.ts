import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CancelOrderUseCase } from "../../application/use-cases/cancel-order.use-case";
import { ConfirmOrderUseCase } from "../../application/use-cases/confirm-order.use-case";
import { CreateOrderUseCase } from "../../application/use-cases/create-order.use-case";
import { DeliverOrderUseCase } from "../../application/use-cases/deliver-order.use-case";
import { GetOrderByIdUseCase } from "../../application/use-cases/get-order-by-id.use-case";
import { GetOrdersUseCase } from "../../application/use-cases/get-orders.use-case";
import { StartPreparingOrderUseCase } from "../../application/use-cases/start-preparing-order.use-case";
import { UpdateOrderUseCase } from "../../application/use-cases/update-order.use-case";
import { Order } from "../../domain/entities/order.entity";
import { CreateOrderDto } from "../dto/create-order.dto";
import { OrderQueryDto } from "../dto/order-query.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";

@Controller("api/orders")
export class OrdersController {
  constructor(
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderUseCase: UpdateOrderUseCase,
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    private readonly startPreparingOrderUseCase: StartPreparingOrderUseCase,
    private readonly deliverOrderUseCase: DeliverOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Get()
  async findAll(@Query() query: OrderQueryDto): Promise<Order[]> {
    return this.getOrdersUseCase.execute(query);
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<Order> {
    return this.getOrderByIdUseCase.execute(id);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.createOrderUseCase.execute(dto);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.updateOrderUseCase.execute(id, dto);
  }

  @Post(":id/confirm")
  async confirm(@Param("id", ParseIntPipe) id: number): Promise<Order> {
    return this.confirmOrderUseCase.execute(id);
  }

  @Post(":id/start-preparing")
  async startPreparing(@Param("id", ParseIntPipe) id: number): Promise<Order> {
    return this.startPreparingOrderUseCase.execute(id);
  }

  @Post(":id/deliver")
  async deliver(@Param("id", ParseIntPipe) id: number): Promise<Order> {
    return this.deliverOrderUseCase.execute(id);
  }

  @Post(":id/cancel")
  async cancel(@Param("id", ParseIntPipe) id: number): Promise<Order> {
    return this.cancelOrderUseCase.execute(id);
  }
}
