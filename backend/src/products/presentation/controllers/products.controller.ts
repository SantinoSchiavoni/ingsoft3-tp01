import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { DeactivateProductUseCase } from "../../application/use-cases/deactivate-product.use-case";
import { GetProductByIdUseCase } from "../../application/use-cases/get-product-by-id.use-case";
import { GetProductsUseCase } from "../../application/use-cases/get-products.use-case";
import { UpdateProductUseCase } from "../../application/use-cases/update-product.use-case";
import { Product } from "../../domain/entities/product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";

@Controller("api/products")
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deactivateProductUseCase: DeactivateProductUseCase,
  ) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.getProductsUseCase.execute();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<Product> {
    return this.getProductByIdUseCase.execute(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.createProductUseCase.execute(dto);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.updateProductUseCase.execute(id, dto);
  }

  @Patch(":id/deactivate")
  async deactivate(@Param("id", ParseIntPipe) id: number): Promise<Product> {
    return this.deactivateProductUseCase.execute(id);
  }
}
