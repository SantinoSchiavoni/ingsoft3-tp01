#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Checking if seed is needed..."
# Only seed if products table is empty
PRODUCT_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.count().then(n => { console.log(n); prisma.\$disconnect(); }).catch(() => { console.log('0'); process.exit(0); });
")

if [ "$PRODUCT_COUNT" = "0" ]; then
  echo "Database is empty, running seed..."
  node prisma/seed.js
  echo "Seed completed."
else
  echo "Database already has $PRODUCT_COUNT products, skipping seed."
fi

echo "Starting NestJS server..."
exec node dist/main
