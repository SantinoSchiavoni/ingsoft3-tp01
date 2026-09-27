import { OrderStatus, Product } from '../types';

/**
 * Valida si el nombre del cliente cumple con los requisitos del negocio:
 * No nulo, entre 2 y 100 caracteres tras quitar espacios.
 */
export function validateCustomerName(name?: string | null): {
  isValid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'El nombre del cliente es obligatorio.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'El nombre debe contener al menos 2 caracteres.',
    };
  }
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'El nombre no puede exceder los 100 caracteres.',
    };
  }
  return { isValid: true };
}

/**
 * Calcula el total acumulado de un listado de ítems redondeado a 2 decimales.
 */
export function calculateOrderTotal(
  items: { unitPrice: number; quantity: number }[],
): number {
  if (!items || items.length === 0) return 0;
  const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

/**
 * Determina si un pedido puede ser cancelado según su estado actual.
 * Sólo los estados PENDING y CONFIRMED permiten cancelación.
 */
export function isStatusCancelable(status: OrderStatus | string): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

/**
 * Función que obtiene productos y filtra sólo los activos.
 * Recibe el cliente HTTP (fetcher) por parámetro (Inyección de Dependencias)
 * permitiendo ser testeada con un Mock sin tocar la red, siguiendo el patrón de la cátedra (§3.0).
 */
export async function getActiveProducts(
  fetcher: (url: string) => Promise<Product[]>,
): Promise<Product[]> {
  const products = await fetcher('/api/products');
  return products.filter((p) => p.active);
}
