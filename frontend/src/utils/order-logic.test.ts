import { describe, it, expect, vi } from 'vitest';
import {
  validateCustomerName,
  calculateOrderTotal,
  isStatusCancelable,
  getActiveProducts,
  determineOrderPriority,
} from './order-logic';
import { Product } from '../types';

describe('Frontend Unit Tests - Order Logic (AAA)', () => {
  // =========================================================================
  // 1. TEST PARAMETRIZADO (it.each)
  // =========================================================================
  describe('isStatusCancelable - Permisos de cancelación según estado', () => {
    it.each([
      ['PENDING', true],
      ['CONFIRMED', true],
      ['PREPARING', false],
      ['DELIVERED', false],
      ['CANCELLED', false],
    ])(
      'para el estado %s determina cancelable = %s',
      (status, expectedCancelable) => {
        // Arrange & Act
        const result = isStatusCancelable(status);

        // Assert
        expect(result).toBe(expectedCancelable);
      },
    );
  });

  // =========================================================================
  // 2. CASO DE ERROR / BORDE (Inputs inválidos)
  // =========================================================================
  describe('validateCustomerName - Validaciones y casos de borde', () => {
    it('rechaza nombre con longitud menor a dos caracteres (Caso de borde)', () => {
      // Arrange
      const nombreInvalido = ' J ';

      // Act
      const result = validateCustomerName(nombreInvalido);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('al menos 2 caracteres');
    });

    it('acepta un nombre válido con espacios en los extremos', () => {
      // Arrange
      const nombreValido = '  Santino Schiavoni  ';

      // Act
      const result = validateCustomerName(nombreValido);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. CÁLCULO PURO
  // =========================================================================
  describe('calculateOrderTotal - Cálculo acumulado de importes', () => {
    it('calcula el total sumando subtotales y redondea correctamente a dos decimales', () => {
      // Arrange
      const items = [
        { unitPrice: 19.99, quantity: 2 }, // 39.98
        { unitPrice: 5.55, quantity: 1 },  // 5.55
      ];

      // Act
      const total = calculateOrderTotal(items);

      // Assert: 39.98 + 5.55 = 45.53
      expect(total).toBe(45.53);
    });

    it('devuelve cero si la lista de items está vacía', () => {
      // Arrange & Act & Assert
      expect(calculateOrderTotal([])).toBe(0);
    });
  });

  // =========================================================================
  // 4. TEST CON MOCK OBLIGATORIO (vi.fn() - Doble de prueba para cliente HTTP)
  // =========================================================================
  describe('getActiveProducts - Inyección de dependencia y verificación de mock', () => {
    it('solicita la ruta /api/products y filtra únicamente productos activos (Mock obligatorio)', async () => {
      // Arrange: impostor del cliente HTTP creado con vi.fn()
      const mockFetcher = vi.fn().mockResolvedValue([
        { id: 1, name: 'Monitor', price: 200, stock: 5, active: true },
        { id: 2, name: 'Mouse Antiguo', price: 20, stock: 0, active: false },
        { id: 3, name: 'Teclado Mecánico', price: 80, stock: 10, active: true },
      ] as Product[]);

      // Act: ejecutar la función bajo prueba inyectando el doble
      const activos = await getActiveProducts(mockFetcher);

      // Assert: verificación del resultado y de la INTERACCIÓN con el mock
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(mockFetcher).toHaveBeenCalledWith('/api/products');
      expect(activos).toHaveLength(2);
      expect(activos.map((p) => p.name)).toEqual(['Monitor', 'Teclado Mecánico']);
    });
  });

  // =========================================================================
  // 5. NUEVOS TESTS: determineOrderPriority (Recuperación de Quality Gate a verde)
  // =========================================================================
  describe('determineOrderPriority - Cobertura de caminos declarados', () => {
    it('asigna CRITICAL (12h) a cliente VIP con total superior a 50.000', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 60000, itemCount: 2, isVipCustomer: true });

      // Assert
      expect(result).toEqual({ priority: 'CRITICAL', maxDeliveryHours: 12 });
    });

    it('asigna HIGH (24h) a cliente VIP con total menor o igual a 50.000', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 30000, itemCount: 1, isVipCustomer: true });

      // Assert
      expect(result).toEqual({ priority: 'HIGH', maxDeliveryHours: 24 });
    });

    it('asigna HIGH (24h) a pedido regular con total mayor o igual a 100.000', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 100000, itemCount: 5 });

      // Assert
      expect(result).toEqual({ priority: 'HIGH', maxDeliveryHours: 24 });
    });

    it('asigna HIGH (24h) a pedido regular por volumen de items (>= 20)', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 10000, itemCount: 25 });

      // Assert
      expect(result).toEqual({ priority: 'HIGH', maxDeliveryHours: 24 });
    });

    it('asigna NORMAL (48h) a pedido regular con total entre 20.000 y 99.999', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 25000, itemCount: 4 });

      // Assert
      expect(result).toEqual({ priority: 'NORMAL', maxDeliveryHours: 48 });
    });

    it('asigna LOW (72h) a pedido regular de bajo importe y pocos items', () => {
      // Arrange & Act
      const result = determineOrderPriority({ total: 5000, itemCount: 2 });

      // Assert
      expect(result).toEqual({ priority: 'LOW', maxDeliveryHours: 72 });
    });
  });
});
