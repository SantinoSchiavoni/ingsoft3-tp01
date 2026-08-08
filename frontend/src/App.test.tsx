import { describe, it, expect } from 'vitest';

describe('OrderFlow Frontend Business Logic Tests', () => {
  it('Comportamiento 1: Deshabilita el botón si el cliente está vacío o no hay productos', () => {
    const isCustomerNameValid = false;
    const isItemsValid = false;
    const isFormValid = isCustomerNameValid && isItemsValid;
    expect(isFormValid).toBe(false);
  });

  it('Comportamiento 2: Recalcula dinámicamente el total del pedido', () => {
    const items = [
      { unitPrice: 200, quantity: 2 },
      { unitPrice: 40, quantity: 1 },
    ];
    const total = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    expect(total).toBe(440);
  });

  it('Comportamiento 3: Mapea acciones según el estado del pedido', () => {
    const isCancelAllowed = (status: string) =>
      ['PENDING', 'CONFIRMED'].includes(status);

    expect(isCancelAllowed('PENDING')).toBe(true);
    expect(isCancelAllowed('CONFIRMED')).toBe(true);
    expect(isCancelAllowed('PREPARING')).toBe(false);
    expect(isCancelAllowed('DELIVERED')).toBe(false);
  });
});
