const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // Create Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Monitor 24"',
      description: 'Monitor Full HD IPS 75Hz',
      price: 250.0,
      stock: 10,
      active: true,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Teclado Mecánico',
      description: 'Teclado mecánico RGB switch azul',
      price: 80.0,
      stock: 20,
      active: true,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Mouse Óptico',
      description: 'Mouse ergonómico 3200 DPI',
      price: 40.0,
      stock: 25,
      active: true,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Notebook 15"',
      description: 'Intel i7 16GB RAM 512GB SSD',
      price: 900.0,
      stock: 5,
      active: true,
    },
  });

  console.log('Products created successfully.');

  // Create sample orders
  await prisma.order.create({
    data: {
      customerName: 'Juan Pérez',
      status: 'PENDING',
      total: 540.0,
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.name,
            unitPrice: p1.price,
            quantity: 2,
            subtotal: 500.0,
          },
          {
            productId: p3.id,
            productName: p3.name,
            unitPrice: p3.price,
            quantity: 1,
            subtotal: 40.0,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'María González',
      status: 'CONFIRMED',
      total: 160.0,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            unitPrice: p2.price,
            quantity: 2,
            subtotal: 160.0,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'Carlos López',
      status: 'PREPARING',
      total: 900.0,
      items: {
        create: [
          {
            productId: p4.id,
            productName: p4.name,
            unitPrice: p4.price,
            quantity: 1,
            subtotal: 900.0,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'Ana Martínez',
      status: 'DELIVERED',
      total: 80.0,
      items: {
        create: [
          {
            productId: p3.id,
            productName: p3.name,
            unitPrice: p3.price,
            quantity: 2,
            subtotal: 80.0,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'Pedro Rodríguez',
      status: 'CANCELLED',
      total: 80.0,
      items: {
        create: [
          {
            productId: p2.id,
            productName: p2.name,
            unitPrice: p2.price,
            quantity: 1,
            subtotal: 80.0,
          },
        ],
      },
    },
  });

  console.log('Sample orders created successfully.');
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
