/// <reference types="jest" />
import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { OrderStatus } from "../enums/order-status.enum";
import {
  EmptyOrderError,
  InvalidQuantityError,
  InvalidCustomerNameError,
  DuplicateProductInOrderError,
  InvalidOrderStateTransitionError,
  OrderCannotBeModifiedError,
} from "../errors/order.errors";

describe("Order Domain Entity - Unit Tests (AAA)", () => {
  // =========================================================================
  // REGLA 1: Validación y cálculo de items del pedido (OrderItem)
  // =========================================================================
  describe("Regla 1: Validación y cálculo de items (OrderItem)", () => {
    // Test Parametrizado (it.each)
    it.each([
      [0, "cero"],
      [-1, "negativo"],
      [1.5, "decimal"],
      [-10, "negativo grande"],
    ])(
      "rechaza cantidad inválida: %s (%s)",
      (cantidadInvalida) => {
        // Arrange & Act & Assert
        expect(() => {
          new OrderItem({
            productId: 1,
            productName: "Monitor 24",
            unitPrice: 200,
            quantity: cantidadInvalida,
          });
        }).toThrow(InvalidQuantityError);
      },
    );

    it("rechaza precio unitario menor o igual a cero (Caso de error)", () => {
      // Arrange
      const precioInvalido = 0;

      // Act & Assert
      expect(() => {
        new OrderItem({
          productId: 1,
          productName: "Monitor 24",
          unitPrice: precioInvalido,
          quantity: 2,
        });
      }).toThrow(/Unit price must be positive/);
    });

    it("calcula correctamente el subtotal redondeando a dos decimales", () => {
      // Arrange
      const item = new OrderItem({
        productId: 1,
        productName: "Cable HDMI",
        unitPrice: 19.99,
        quantity: 3,
      });

      // Act
      const subtotal = item.subtotal;

      // Assert: 19.99 * 3 = 59.97
      expect(subtotal).toBe(59.97);
    });
  });

  // =========================================================================
  // REGLA 2: Integridad y composición del pedido (Order)
  // =========================================================================
  describe("Regla 2: Integridad y composición del pedido (Order)", () => {
    it("rechaza nombre de cliente menor a 2 caracteres o con solo espacios (Caso de borde)", () => {
      // Arrange
      const nombreCorto = " A ";
      const itemsValidos = [
        new OrderItem({
          productId: 1,
          productName: "Teclado",
          unitPrice: 50,
          quantity: 1,
        }),
      ];

      // Act & Assert
      expect(() => {
        new Order({
          customerName: nombreCorto,
          items: itemsValidos,
        });
      }).toThrow(InvalidCustomerNameError);
    });

    it("rechaza creación de pedido vacío sin items (Caso de error)", () => {
      // Arrange
      const itemsVacios: OrderItem[] = [];

      // Act & Assert
      expect(() => {
        new Order({
          customerName: "Juan Pérez",
          items: itemsVacios,
        });
      }).toThrow(EmptyOrderError);
    });

    it("rechaza pedido cuando contiene productos duplicados (Caso de error)", () => {
      // Arrange
      const item1 = new OrderItem({
        productId: 1,
        productName: "Mouse",
        unitPrice: 25,
        quantity: 1,
      });
      const itemDuplicado = new OrderItem({
        productId: 1,
        productName: "Mouse",
        unitPrice: 25,
        quantity: 2,
      });

      // Act & Assert
      expect(() => {
        new Order({
          customerName: "Juan Pérez",
          items: [item1, itemDuplicado],
        });
      }).toThrow(DuplicateProductInOrderError);
    });

    it("calcula correctamente el total acumulado sumando los subtotales de los items", () => {
      // Arrange
      const item1 = new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 2, // subtotal: 400
      });
      const item2 = new OrderItem({
        productId: 2,
        productName: "Mouse",
        unitPrice: 49.99,
        quantity: 1, // subtotal: 49.99
      });

      // Act
      const order = new Order({
        customerName: "Juan Pérez",
        items: [item1, item2],
      });

      // Assert: 400 + 49.99 = 449.99
      expect(order.total).toBe(449.99);
    });
  });

  // =========================================================================
  // REGLA 3: Máquina de estados del ciclo de vida del pedido (Order)
  // =========================================================================
  describe("Regla 3: Máquina de estados y transiciones válidas e inválidas", () => {
    it("permite transición secuencial válida de PENDING a CONFIRMED y de PREPARING a DELIVERED", () => {
      // Arrange
      const item = new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 1,
      });
      const order = new Order({
        customerName: "Juan Pérez",
        items: [item],
      });

      // Act & Assert 1: PENDING -> CONFIRMED
      expect(order.status).toBe(OrderStatus.PENDING);
      order.confirm();
      expect(order.status).toBe(OrderStatus.CONFIRMED);

      // Act & Assert 2: CONFIRMED -> PREPARING
      order.startPreparing();
      expect(order.status).toBe(OrderStatus.PREPARING);

      // Act & Assert 3: PREPARING -> DELIVERED
      order.deliver();
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it("rechaza transicion invalida al intentar entregar directamente desde CONFIRMED (Caso de error)", () => {
      // Arrange
      const item = new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 1,
      });
      const order = new Order({
        customerName: "Juan Pérez",
        status: OrderStatus.CONFIRMED,
        items: [item],
      });

      // Act & Assert: no puede pasar a DELIVERED sin haber pasado por PREPARING
      expect(() => order.deliver()).toThrow(InvalidOrderStateTransitionError);
    });

    it("impide modificar o cancelar un pedido que ya fue entregado DELIVERED (Invariante)", () => {
      // Arrange
      const item1 = new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 1,
      });
      const item2 = new OrderItem({
        productId: 2,
        productName: "Teclado",
        unitPrice: 50,
        quantity: 1,
      });
      const order = new Order({
        customerName: "Juan Pérez",
        status: OrderStatus.DELIVERED,
        items: [item1],
      });

      // Act & Assert 1: No permite modificar detalles
      expect(() => order.updateDetails("Nuevo Cliente", [item2])).toThrow(
        OrderCannotBeModifiedError,
      );

      // Act & Assert 2: No permite cancelar
      expect(() => order.cancel()).toThrow(InvalidOrderStateTransitionError);
    });

    it("impide reactivar o confirmar un pedido cancelado CANCELLED (Invariante)", () => {
      // Arrange
      const item = new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 1,
      });
      const order = new Order({
        customerName: "Juan Pérez",
        status: OrderStatus.CANCELLED,
        items: [item],
      });

      // Act & Assert: No puede volver a confirmarse
      expect(() => order.confirm()).toThrow(InvalidOrderStateTransitionError);
    });
  });
});
