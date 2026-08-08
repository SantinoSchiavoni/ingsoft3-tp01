import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "../../domain/enums/order-status.enum";

export class OrderQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  customerName?: string;
}
