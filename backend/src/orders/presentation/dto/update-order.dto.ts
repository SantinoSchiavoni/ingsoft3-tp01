import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateOrderItemDto } from "./create-order.dto";

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1, { message: "Items array cannot be empty if provided" })
  @IsOptional()
  items?: CreateOrderItemDto[];
}
