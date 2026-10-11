import { expect, test } from '@playwright/test';

// La api tiene su propia dirección: NO es la del front. Sin barra al final.
const API = process.env.API_BASE_URL || 'http://localhost:3000';

// Helper: obtiene o crea un producto activo para usar en los pedidos de prueba
async function obtenerProductoActivo(request) {
  const r = await request.get(`${API}/api/products`);
  expect(r.status()).toBe(200);
  const productos = await r.json();
  const activo = productos.find((p) => p.active && p.stock > 0);
  if (activo) return activo;

  // Si no hay productos activos en la base, creamos uno de prueba
  const nuevo = await request.post(`${API}/api/products`, {
    data: {
      name: `Producto API ${Date.now()}`,
      description: 'Producto creado para prueba de integración',
      price: 150.0,
      stock: 50,
      active: true,
    },
  });
  expect(nuevo.status()).toBe(201);
  return await nuevo.json();
}

// Helper: lista los pedidos directamente desde la base de verdad
async function listarPedidos(request) {
  const r = await request.get(`${API}/api/orders`);
  expect(r.status()).toBe(200);
  return await r.json();
}

test.describe('Suite de Integración - API de Ordenes (sin dobles ni navegador)', () => {
  // Test 1 (a): Alta + verificación en la base de verdad + borrado/limpieza
  test('el alta guarda en la base de verdad, y el borrado la saca', async ({ request }) => {
    const producto = await obtenerProductoActivo(request);
    const customerName = `api ${Date.now()}`;

    // 1. Alta: POST /api/orders
    const alta = await request.post(`${API}/api/orders`, {
      data: {
        customerName,
        items: [{ productId: producto.id, quantity: 1 }],
      },
    });
    expect(alta.status()).toBe(201);
    const creada = await alta.json();
    expect(creada.id).toBeDefined();

    // 2. Verificación: la BASE DE VERDAD la devuelve en el GET
    const lista = await listarPedidos(request);
    const encontrada = lista.some((o) => (o.customerName || o._customerName) === customerName);
    expect(encontrada).toBe(true);

    // 3. Borrado: DELETE /api/orders/:id limpia el dato
    const borrado = await request.delete(`${API}/api/orders/${creada.id}`);
    expect(borrado.status()).toBe(204);

    // 4. Verificación de borrado: ya no existe en la lista
    const despues = await listarPedidos(request);
    const sigueExistiendo = despues.some((o) => (o.customerName || o._customerName) === customerName);
    expect(sigueExistiendo).toBe(false);
  });

  // Test 2 (b): Alta inválida es rechazada con 400 y no persiste nada
  test('un nombre de cliente vacío o inválido es rechazado con 400 y no crea nada', async ({ request }) => {
    const producto = await obtenerProductoActivo(request);
    const antes = await listarPedidos(request);

    // Intento de alta con customerName vacío
    const altaInvalida = await request.post(`${API}/api/orders`, {
      data: {
        customerName: '',
        items: [{ productId: producto.id, quantity: 1 }],
      },
    });
    expect(altaInvalida.status()).toBe(400);

    // Verificamos en la base que la cantidad de pedidos no cambió
    const despues = await listarPedidos(request);
    expect(despues.length).toBe(antes.length);
  });

  // Test 3 (c): Ciclo de vida y transición de estado (PENDING -> CONFIRMED)
  test('transición de estado a CONFIRMED en la base de verdad y posterior borrado', async ({ request }) => {
    const producto = await obtenerProductoActivo(request);
    const customerName = `api-confirm ${Date.now()}`;

    // 1. Crear pedido inicial
    const alta = await request.post(`${API}/api/orders`, {
      data: {
        customerName,
        items: [{ productId: producto.id, quantity: 1 }],
      },
    });
    expect(alta.status()).toBe(201);
    const creada = await alta.json();

    // 2. Confirmar pedido mediante endpoint de dominio
    const confirm = await request.post(`${API}/api/orders/${creada.id}/confirm`);
    expect(confirm.status()).toBe(201);
    const confirmada = await confirm.json();
    expect(confirmada.status || confirmada._status).toBe('CONFIRMED');

    // 3. Limpiar el pedido creado
    const borrado = await request.delete(`${API}/api/orders/${creada.id}`);
    expect(borrado.status()).toBe(204);
  });
});
