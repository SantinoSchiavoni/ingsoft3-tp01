import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { Product } from "../../../domain/entities/product.entity";
import { ProductRepository } from "../../../domain/repositories/product.repository";
import { Product as PrismaProductModel } from "@prisma/client";

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(raw: PrismaProductModel): Product {
    return new Product({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: raw.price.toNumber(),
      stock: raw.stock,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: number): Promise<Product | null> {
    const found = await this.prisma.product.findUnique({ where: { id } });
    return found ? this.mapToDomain(found) : null;
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    return products.map((p) => this.mapToDomain(p));
  }

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return products.map((p) => this.mapToDomain(p));
  }

  async save(product: Product): Promise<Product> {
    const created = await this.prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        active: product.active,
      },
    });
    return this.mapToDomain(created);
  }

  async update(
    id: number,
    data: Partial<Omit<Product, "id">>,
  ): Promise<Product> {
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
    return this.mapToDomain(updated);
  }

  async deactivate(id: number): Promise<Product> {
    const updated = await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return this.mapToDomain(updated);
  }
}
