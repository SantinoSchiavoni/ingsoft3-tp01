import { expect, test } from '@playwright/test';

test.describe('Suite E2E - Flujos Críticos de la Aplicación (Navegador Real)', () => {
  // Flujo 1: Crear un pedido, verificarlo en la lista y borrarlo
  test('crear un pedido lo muestra en la lista, y borrarlo lo saca', async ({ page }) => {
    await page.goto('/orders');

    // 1. Navegar a creación
    await page.getByRole('link', { name: '+ Nuevo Pedido' }).click();
    await expect(page).toHaveURL(/.*orders\/new/);

    // 2. Completar formulario con nombre único
    const customerName = `e2e ${Date.now()}`;
    await page.getByLabel('Nombre del Cliente').fill(customerName);

    // 3. Seleccionar producto y cantidad
    await page.getByLabel('Producto Activo').selectOption({ index: 1 });
    await page.getByLabel('Cantidad').fill('2');
    await page.getByRole('button', { name: 'Agregar Item' }).click();

    // 4. Crear el pedido
    await page.getByRole('button', { name: 'Crear Pedido' }).click();

    // 5. Volver al listado y verificar que aparezca
    await page.goto('/orders');
    await expect(page.getByText(customerName)).toBeVisible();

    // 6. Borrar el pedido recién creado y comprobar que desaparece
    await page.getByRole('button', { name: `Borrar ${customerName}` }).click();
    await expect(page.getByText(customerName)).toHaveCount(0);
  });

  // Flujo 2: Validación de cliente inválido muestra error y bloquea creación
  test('un nombre de cliente inválido muestra error y bloquea el botón de creación', async ({ page }) => {
    await page.goto('/orders/new');

    // Nombre demasiado corto (menos de 2 caracteres)
    await page.getByLabel('Nombre del Cliente').fill('a');

    // Comprobar que se muestra el aviso accesible de error
    await expect(page.getByRole('alert')).toBeVisible();

    // El botón de submit debe encontrarse deshabilitado
    await expect(page.getByRole('button', { name: 'Crear Pedido' })).toBeDisabled();

    // Comprobar en el listado que no se creó nada
    await page.goto('/orders');
    await expect(page.getByText(/^a$/)).toHaveCount(0);
  });

  // Flujo 3: Búsqueda de cliente en tiempo real (flujo diario de mostrador)
  test('buscar un cliente existente filtra la tabla mostrando su pedido y limpiando el dato', async ({ page }) => {
    // 1. Crear un pedido para buscar
    await page.goto('/orders/new');
    const customerName = `e2e-search ${Date.now()}`;
    await page.getByLabel('Nombre del Cliente').fill(customerName);
    await page.getByLabel('Producto Activo').selectOption({ index: 1 });
    await page.getByLabel('Cantidad').fill('1');
    await page.getByRole('button', { name: 'Agregar Item' }).click();
    await page.getByRole('button', { name: 'Crear Pedido' }).click();

    // 2. El usuario va al listado y busca al cliente por su nombre
    await page.goto('/orders');
    await page.getByLabel('Buscar Cliente').fill(customerName);

    // 3. Comprobar que la búsqueda contra la base de datos filtra y muestra el pedido
    await expect(page.getByText(customerName)).toBeVisible();

    // 4. Limpiar lo creado comprobando que desaparece
    await page.getByRole('button', { name: `Borrar ${customerName}` }).click();
    await expect(page.getByText(customerName)).toHaveCount(0);
  });
});
