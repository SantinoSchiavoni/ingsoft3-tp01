/// <reference types="jest" />
import { CreateOrderUseCase } from "./create-order.use-case";
import { ConfirmOrderUseCase } from "./confirm-order.use-case";
import { CancelOrderUseCase } from "./cancel-order.use-case";
import { DeleteOrderUseCase } from "./delete-order.use-case";
import { Product } from "../../../products/domain/entities/product.entity";
import { ProductInactiveError } from "../../../products/domain/errors/product.errors";
import {
  InsufficientStockError,
  OrderNotFoundError,
} from "../../domain/errors/order.errors";
import { OrderStatus } from "../../domain/enums/order-status.enum";
import { OrderRepository } from "../../domain/repositories/order.repository";
import { ProductRepository } from "../../../products/domain/repositories/product.repository";
import { Order } from "../../domain/entities/order.entity";
import { OrderItem } from "../../domain/entities/order-item.entity";

describe("Order Use Cases (Application Layer) - Unit Tests (AAA)", () => {
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    // Arrange global: Dobles de prueba (Mocks) para aislar la capa de aplicación de la BD
    mockOrderRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      confirmWithStockDeduction: jest.fn(),
      cancelWithStockRestoration: jest.fn(),
      delete: jest.fn(),
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

  // =========================================================================
  // REGLA 4: Descuento y restauración de stock en Casos de Uso (MOCKS OBLIGATORIOS)
  // =========================================================================
  describe("Regla 4: Descuento y restauración transaccional de stock con Mocks", () => {
    it("confirmar pedido con stock suficiente descuenta stock e invoca al repositorio (Mock obligatorio)", async () => {
      // Arrange: preparar el doble de riesgo (Mock) y los datos de prueba
      const product = new Product({
        id: 1,
        name: "Monitor 27",
        price: 300,
        stock: 10,
        active: true,
      });

      const order = new Order({
        id: 100,
        customerName: "Juan Pérez",
        status: OrderStatus.PENDING,
        items: [
          new OrderItem({
            productId: 1,
            productName: "Monitor 27",
            unitPrice: 300,
            quantity: 3,
          }),
        ],
      });

      // Configuramos el comportamiento del mock (Stubbing de respuestas)
      mockOrderRepository.findById.mockResolvedValue(order);
      mockProductRepository.findByIds.mockResolvedValue([product]);
      mockOrderRepository.confirmWithStockDeduction.mockImplementation(
        async (o) => o,
      );

      const useCase = new ConfirmOrderUseCase(
        mockOrderRepository,
        mockProductRepository,
      );

      // Act: ejecutar la acción bajo prueba
      const confirmedOrder = await useCase.execute(100);

      // Assert: verificar estado retornado e INTERACCIÓN con el mock
      expect(confirmedOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(
        mockOrderRepository.confirmWithStockDeduction,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockOrderRepository.confirmWithStockDeduction,
      ).toHaveBeenCalledWith(expect.anything(), [
        { productId: 1, quantity: 3 },
      ]);
    });

    it("confirmar pedido sin stock suficiente lanza InsufficientStockError y NUNCA persiste descuento (Caso de error)", async () => {
      // Arrange: producto con stock insuficiente (stock: 2, pedido: 5)
      const product = new Product({
        id: 1,
        name: "Monitor 27",
        price: 300,
        stock: 2,
        active: true,
      });

      const order = new Order({
        id: 100,
        customerName: "Juan Pérez",
        status: OrderStatus.PENDING,
        items: [
          new OrderItem({
            productId: 1,
            productName: "Monitor 27",
            unitPrice: 300,
            quantity: 5,
          }),
        ],
      });

      mockOrderRepository.findById.mockResolvedValue(order);
      mockProductRepository.findByIds.mockResolvedValue([product]);

      const useCase = new ConfirmOrderUseCase(
        mockOrderRepository,
        mockProductRepository,
      );

      // Act & Assert
      await expect(useCase.execute(100)).rejects.toThrow(
        InsufficientStockError,
      );

      // Verificamos que el mock NUNCA fue llamado para deducir stock
      expect(
        mockOrderRepository.confirmWithStockDeduction,
      ).not.toHaveBeenCalled();
    });

    it("cancelar pedido confirmado restaura stock e invoca cancelWithStockRestoration en el repositorio", async () => {
      // Arrange: pedido previamente confirmado
      const confirmedOrder = new Order({
        id: 100,
        customerName: "Juan Pérez",
        status: OrderStatus.CONFIRMED,
        items: [
          new OrderItem({
            productId: 1,
            productName: "Monitor 27",
            unitPrice: 300,
            quantity: 2,
          }),
        ],
      });

      mockOrderRepository.findById.mockResolvedValue(confirmedOrder);
      mockOrderRepository.cancelWithStockRestoration.mockImplementation(
        async (o) => o,
      );

      const useCase = new CancelOrderUseCase(mockOrderRepository);

      // Act: cancelar el pedido confirmado
      const cancelledOrder = await useCase.execute(100);

      // Assert
      expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
      expect(
        mockOrderRepository.cancelWithStockRestoration,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockOrderRepository.cancelWithStockRestoration,
      ).toHaveBeenCalledWith(expect.anything(), [
        { productId: 1, quantity: 2 },
      ]);
    });

    it("crear pedido con producto inactivo lanza ProductInactiveError y no guarda en base de datos (Caso de error)", async () => {
      // Arrange: producto inactivo en catálogo
      const inactiveProduct = new Product({
        id: 99,
        name: "Teclado Descontinuado",
        price: 45,
        stock: 10,
        active: false,
      });

      mockProductRepository.findByIds.mockResolvedValue([inactiveProduct]);

      const useCase = new CreateOrderUseCase(
        mockOrderRepository,
        mockProductRepository,
      );

      // Act & Assert: debe rechazar la creación
      await expect(
        useCase.execute({
          customerName: "Ana Gómez",
          items: [{ productId: 99, quantity: 1 }],
        }),
      ).rejects.toThrow(ProductInactiveError);

      // Verificamos que no se persistió nada en el repositorio
      expect(mockOrderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("DeleteOrderUseCase", () => {
    it("elimina un pedido existente correctamente", async () => {
      const order = new Order({
        id: 10,
        customerName: "Carlos Gómez",
        status: OrderStatus.PENDING,
        items: [
          new OrderItem({
            productId: 1,
            productName: "Monitor",
            unitPrice: 100,
            quantity: 1,
          }),
        ],
      });
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.delete.mockResolvedValue();

      const useCase = new DeleteOrderUseCase(mockOrderRepository);
      await useCase.execute(10);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(10);
      expect(mockOrderRepository.delete).toHaveBeenCalledWith(10);
    });

    it("lanza OrderNotFoundError si el pedido no existe", async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const useCase = new DeleteOrderUseCase(mockOrderRepository);
      await expect(useCase.execute(999)).rejects.toThrow(OrderNotFoundError);
      expect(mockOrderRepository.delete).not.toHaveBeenCalled();
    });
  });
});
