[![CI](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/workflows/ci.yml/badge.svg)](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/workflows/ci.yml)

# OrderFlow — Gestor de Pedidos Full-Stack

**OrderFlow** es una aplicación full-stack diseñada e implementada para la materia **Ingeniería de Software III**. Es un sistema ligero, mantenible y limpio de gestión interna de productos y pedidos, estructurado bajo **Clean / Hexagonal Architecture** en el backend y una interfaz dinámica en **React + TypeScript + Vite** en el frontend.

---

## 🚀 Requisitos previos

- **Node.js**: v20+ 
- **npm**: v10+
- **Docker**: v24+ & **Docker Compose**: v2.20+

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, React Router DOM, Vanilla CSS |
| **Backend** | NestJS, TypeScript, Clean Architecture |
| **Base de Datos** | PostgreSQL 16 |
| **ORM** | Prisma ORM |
| **Contenedores** | Docker, Docker Compose |

---

## ⚙️ Variables de Entorno

### Backend (`/backend/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://orderflow:orderflow@localhost:5432/orderflow?schema=public"
CORS_ORIGIN="http://localhost:41777"
```

### Frontend (`/frontend/.env`)
```env
VITE_API_URL="http://localhost:3000"
```

---

## 🐳 Ejecución con Docker Compose (Recomendado)

Inicia toda la infraestructura (**PostgreSQL**, **Backend NestJS** y **Frontend Nginx**) con un solo comando:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:41777](http://localhost:41777)
- **Backend API**: [http://localhost:3000/api/orders](http://localhost:3000/api/orders)
- **Healthcheck**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 💻 Ejecución Manual Local

### 1. Iniciar PostgreSQL
Asegúrate de tener un contenedor o servicio de PostgreSQL activo en el puerto `5432` con las credenciales de tu `.env`.

### 2. Backend Setup
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm ci
npm run dev
```

---

## 🧬 Testing y Cobertura de Código (Quality Gate)

OrderFlow cuenta con suites de pruebas unitarias con estructura **AAA (Arrange, Act, Assert)**, tests parametrizados (`it.each`), casos de error y **mocks obligatorios** con verificación de interacción, respaldados por un **Quality Gate del 70%** de cobertura en líneas y ramas.

### 1. Backend (NestJS + Jest)

```bash
cd backend

# Ejecutar tests unitarios
npm test

# Ejecutar tests con modo detallado (ver los 18 tests)
npm test -- --verbose

# Ejecutar tests con cobertura y verificar el umbral del 70%
npm run test:cov

# Abrir el reporte visual HTML en tu navegador
xdg-open coverage/lcov-report/index.html
```

> **Con Docker (desde la raíz del proyecto):**
> ```bash
> docker run --rm -v "$(pwd)/backend/coverage:/out" backend-test:ci
> xdg-open backend/coverage/lcov-report/index.html
> ```

---

### 2. Frontend (React + Vite + Vitest)

```bash
cd frontend

# Ejecutar tests unitarios
npm test

# Ejecutar tests con cobertura y verificar el umbral del 70%
npm run test:cov

# Abrir el reporte visual HTML en tu navegador
xdg-open coverage/index.html
```

> **Con Docker (desde la raíz del proyecto):**
> ```bash
> docker run --rm -v "$(pwd)/frontend/coverage:/out" frontend-test:ci
> xdg-open frontend/coverage/index.html
> ```

---

### 3. Reportes en CI / GitHub Actions
En cada ejecución del pipeline de GitHub Actions:
- Se publica una tabla resumen con el porcentaje de líneas, ramas y funciones directamente en el **Job Summary** (`$GITHUB_STEP_SUMMARY`).
- Se genera y almacena el reporte HTML interactivo completo como **artefacto descargable** (`coverage-backend` y `coverage-frontend`).
- Si la cobertura cae por debajo del **70%**, el pipeline falla automáticamente con código de salida `1` y bloquea el Pull Request.

---

## 📊 Endpoints REST Principales

### Productos (`/api/products`)
- `GET /api/products`: Lista todos los productos.
- `GET /api/products/:id`: Obtiene un producto por ID.
- `POST /api/products`: Crea un nuevo producto.
- `PATCH /api/products/:id`: Actualiza precio/stock/nombre.
- `PATCH /api/products/:id/deactivate`: Desactiva un producto (borrado lógico).

### Pedidos (`/api/orders`)
- `GET /api/orders`: Lista pedidos (admite query params `?status=...&customerName=...`).
- `GET /api/orders/:id`: Obtiene el detalle de un pedido.
- `POST /api/orders`: Crea un nuevo pedido en estado `PENDING`.
- `PATCH /api/orders/:id`: Actualiza items/cliente mientras esté `PENDING`.
- `POST /api/orders/:id/confirm`: Transición `PENDING` -> `CONFIRMED` (descuenta stock de forma atómica).
- `POST /api/orders/:id/start-preparing`: Transición `CONFIRMED` -> `PREPARING`.
- `POST /api/orders/:id/deliver`: Transición `PREPARING` -> `DELIVERED`.
- `POST /api/orders/:id/cancel`: Cancela el pedido (`PENDING`/`CONFIRMED` -> `CANCELLED`). Restaura el stock si estaba confirmado.

---

## 📄 Registro de Decisiones
Las decisiones de la materia y de arquitectura de OrderFlow se documentan en [`decisiones.md`](decisiones.md).
