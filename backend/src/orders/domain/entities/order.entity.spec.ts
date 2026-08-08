import { OrderItem } from "./order-item.entity";
import { Order } from "./order.entity";
import { OrderStatus } from "../enums/order-status.enum";
import {
  EmptyOrderError,
  InvalidQuantityError,
  DuplicateProductInOrderError,
  InvalidOrderStateTransitionError,
  OrderCannotBeModifiedError,
} from "../errors/order.errors";

describe("Order Domain Entity", () => {
  const sampleItem1 = new OrderItem({
    productId: 1,
    productName: "Monitor",
    unitPrice: 200,
    quantity: 2,
  });

  const sampleItem2 = new OrderItem({
    productId: 2,
    productName: "Mouse",
    unitPrice: 50,
    quantity: 1,
  });

  it("1. crear pedido vacío falla", () => {
    expect(() => {
      new Order({
        customerName: "Juan Pérez",
        items: [],
      });
    }).toThrow(EmptyOrderError);
  });

  it("2. cantidad <= 0 falla", () => {
    expect(() => {
      new OrderItem({
        productId: 1,
        productName: "Monitor",
        unitPrice: 200,
        quantity: 0,
      });
    }).toThrow(InvalidQuantityError);
  });

  it("4. productos duplicados fallan", () => {
    expect(() => {
      new Order({
        customerName: "Juan Pérez",
        items: [
          sampleItem1,
          new OrderItem({
            productId: 1,
            productName: "Monitor",
            unitPrice: 200,
            quantity: 3,
          }),
        ],
      });
    }).toThrow(DuplicateProductInOrderError);
  });

  it("5 & 6. calcula correctamente subtotal y total", () => {
    expect(sampleItem1.subtotal).toBe(400);
    expect(sampleItem2.subtotal).toBe(50);

    const order = new Order({
      customerName: "Juan Pérez",
      items: [sampleItem1, sampleItem2],
    });

    expect(order.total).toBe(450);
  });

  it("11. cancelar PREPARING falla", () => {
    const order = new Order({
      customerName: "Juan Pérez",
      status: OrderStatus.PREPARING,
      items: [sampleItem1],
    });

    expect(() => order.cancel()).toThrow(InvalidOrderStateTransitionError);
  });

  it("12. entregar desde CONFIRMED falla", () => {
    const order = new Order({
      customerName: "Juan Pérez",
      status: OrderStatus.CONFIRMED,
      items: [sampleItem1],
    });

    expect(() => order.deliver()).toThrow(InvalidOrderStateTransitionError);
  });

  it("13. entregar desde PREPARING funciona", () => {
    const order = new Order({
      customerName: "Juan Pérez",
      status: OrderStatus.PREPARING,
      items: [sampleItem1],
    });

    order.deliver();
    expect(order.status).toBe(OrderStatus.DELIVERED);
  });

  it("14. DELIVERED no puede modificarse ni cancelarse", () => {
    const order = new Order({
      customerName: "Juan Pérez",
      status: OrderStatus.DELIVERED,
      items: [sampleItem1],
    });

    expect(() => order.updateDetails("Nuevo Nombre", [sampleItem2])).toThrow(
      OrderCannotBeModifiedError,
    );
    expect(() => order.cancel()).toThrow(InvalidOrderStateTransitionError);
  });

  it("15. CANCELLED no puede reactivarse", () => {
    const order = new Order({
      customerName: "Juan Pérez",
      status: OrderStatus.CANCELLED,
      items: [sampleItem1],
    });

    expect(() => order.confirm()).toThrow(InvalidOrderStateTransitionError);
  });
});
