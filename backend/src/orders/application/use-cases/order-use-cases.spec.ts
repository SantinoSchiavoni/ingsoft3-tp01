import { CreateOrderUseCase } from "./create-order.use-case";
import { ConfirmOrderUseCase } from "./confirm-order.use-case";
import { CancelOrderUseCase } from "./cancel-order.use-case";
import { Product } from "../../../products/domain/entities/product.entity";
import { ProductInactiveError } from "../../../products/domain/errors/product.errors";
import { InsufficientStockError } from "../../domain/errors/order.errors";
import { OrderStatus } from "../../domain/enums/order-status.enum";
import { OrderRepository } from "../../domain/repositories/order.repository";
import { ProductRepository } from "../../../products/domain/repositories/product.repository";
import { Order } from "../../domain/entities/order.entity";
import { OrderItem } from "../../domain/entities/order-item.entity";

describe("Order Use Cases (Application Layer)", () => {
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockOrderRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      confirmWithStockDeduction: jest.fn(),
      cancelWithStockRestoration: jest.fn(),
    };

    mockProductRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
  });

  it("3. producto inactivo falla al crear pedido", async () => {
    const inactiveProduct = new Product({
      id: 1,
      name: "Teclado Antiguo",
      price: 50,
      stock: 10,
      active: false,
    });

    mockProductRepository.findByIds.mockResolvedValue([inactiveProduct]);

    const useCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockProductRepository,
    );

    await expect(
      useCase.execute({
        customerName: "Juan",
        items: [{ productId: 1, quantity: 1 }],
      }),
    ).rejects.toThrow(ProductInactiveError);
  });

  it("7 & 9. confirmar con stock suficiente funciona y descuenta stock", async () => {
    const product = new Product({
      id: 1,
      name: "Monitor",
      price: 200,
      stock: 10,
      active: true,
    });

    const order = new Order({
      id: 100,
      customerName: "Juan",
      status: OrderStatus.PENDING,
      items: [
        new OrderItem({
          productId: 1,
          productName: "Monitor",
          unitPrice: 200,
          quantity: 3,
        }),
      ],
    });

    mockOrderRepository.findById.mockResolvedValue(order);
    mockProductRepository.findByIds.mockResolvedValue([product]);
    mockOrderRepository.confirmWithStockDeduction.mockImplementation(
      async (o) => o,
    );

    const useCase = new ConfirmOrderUseCase(
      mockOrderRepository,
      mockProductRepository,
    );
    const confirmedOrder = await useCase.execute(100);

    expect(confirmedOrder.status).toBe(OrderStatus.CONFIRMED);
    expect(mockOrderRepository.confirmWithStockDeduction).toHaveBeenCalledWith(
      expect.anything(),
      [{ productId: 1, quantity: 3 }],
    );
  });

  it("8. confirmar sin stock suficiente falla", async () => {
    const product = new Product({
      id: 1,
      name: "Monitor",
      price: 200,
      stock: 2, // only 2 in stock
      active: true,
    });

    const order = new Order({
      id: 100,
      customerName: "Juan",
      status: OrderStatus.PENDING,
      items: [
        new OrderItem({
          productId: 1,
          productName: "Monitor",
          unitPrice: 200,
          quantity: 5, // requesting 5
        }),
      ],
    });

    mockOrderRepository.findById.mockResolvedValue(order);
    mockProductRepository.findByIds.mockResolvedValue([product]);

    const useCase = new ConfirmOrderUseCase(
      mockOrderRepository,
      mockProductRepository,
    );

    await expect(useCase.execute(100)).rejects.toThrow(InsufficientStockError);
  });

  it("10. cancelar confirmado restaura stock", async () => {
    const confirmedOrder = new Order({
      id: 100,
      customerName: "Juan",
      status: OrderStatus.CONFIRMED,
      items: [
        new OrderItem({
          productId: 1,
          productName: "Monitor",
          unitPrice: 200,
          quantity: 3,
        }),
      ],
    });

    mockOrderRepository.findById.mockResolvedValue(confirmedOrder);
    mockOrderRepository.cancelWithStockRestoration.mockImplementation(
      async (o) => o,
    );

    const useCase = new CancelOrderUseCase(mockOrderRepository);
    const cancelledOrder = await useCase.execute(100);

    expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
    expect(mockOrderRepository.cancelWithStockRestoration).toHaveBeenCalledWith(
      expect.anything(),
      [{ productId: 1, quantity: 3 }],
    );
  });

  it("16. cambiar precio del producto no modifica pedidos históricos", async () => {
    const originalProduct = new Product({
      id: 1,
      name: "Monitor",
      price: 200,
      stock: 10,
    });

    mockProductRepository.findByIds.mockResolvedValue([originalProduct]);
    mockOrderRepository.save.mockImplementation(async (o) => o);

    const createUseCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockProductRepository,
    );
    const createdOrder = await createUseCase.execute({
      customerName: "Juan",
      items: [{ productId: 1, quantity: 2 }],
    });

    expect(createdOrder.items[0].unitPrice).toBe(200);
    expect(createdOrder.total).toBe(400);

    // Product price changes to 250 in store
    const updatedProduct = new Product({
      id: 1,
      name: "Monitor",
      price: 250,
      stock: 10,
    });
    mockProductRepository.findById.mockResolvedValue(updatedProduct);

    // Historical order item snapshot remains 200
    expect(createdOrder.items[0].unitPrice).toBe(200);
    expect(createdOrder.total).toBe(400);
  });
});
