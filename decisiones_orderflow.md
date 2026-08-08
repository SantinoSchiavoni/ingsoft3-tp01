# Decisiones Técnicas y Arquitectura (OrderFlow)

Este documento registra los Registros de Decisiones de Arquitectura (ADR) para la aplicación **OrderFlow**.

---

## ADR-001 — Stack Tecnológico Principal

### Contexto
Se requiere una aplicación full-stack intencionalmente pequeña, clara, fuertemente tipada y mantenible para el semestre de Ingeniería de Software III.

### Decisión
- **Frontend**: React + TypeScript + Vite (`npm`).
- **Backend**: NestJS + TypeScript (`npm`).
- **Base de datos**: PostgreSQL 16.
- **ORM**: Prisma.

### Consecuencias
- Unificación del lenguaje TypeScript en frontend y backend.
- Tipado estricto end-to-end (evitando `any`).
- Builds ultra rápidos con Vite.
- Mantenimiento sencillo sin frameworks pesados ni monorepos complejos.

---

## ADR-002 — Arquitectura Hexagonal / Clean Architecture Liviana

### Contexto
Se necesita desacoplar la lógica de negocio y las reglas del dominio de NestJS, Prisma y la infraestructura HTTP/PostgreSQL para permitir pruebas unitarias sin dependencias externas y fácil defensa oral.

### Decisión
Organizar el backend en 4 capas concéntricas explícitas:
1. **Domain**: Entidades (`Order`, `Product`, `OrderItem`), Enums (`OrderStatus`), Errores de Dominio y Puertos/Interfaces de Repositorio (`OrderRepository`, `ProductRepository`). Sin importaciones a NestJS o Prisma.
2. **Application**: Casos de uso (`CreateOrderUseCase`, `ConfirmOrderUseCase`, etc.) que coordinan las reglas del dominio y repositorios.
3. **Infrastructure**: Implementaciones concretas (`PrismaOrderRepository`, `PrismaProductRepository`) con transacciones atómicas Prisma.
4. **Presentation**: DTOs con `class-validator` y Controladores NestJS.

### Consecuencias
- Las reglas de negocio pueden probarse sin levantar NestJS ni base de datos.
- Facilidad para sustituir la infraestructura o agregar nuevos adaptadores en el futuro.

---

## ADR-003 — Manejo de Dinero y Decimales

### Contexto
El uso de números de punto flotante de JavaScript genera errores de redondeo acumulativos (e.g. `0.1 + 0.2`).

### Decisión
Utilizar el tipo `Decimal` de Prisma mapeado a `decimal(12,2)` en PostgreSQL. En el dominio se encapsulan redondeos seguros mediante `Math.round((amount + EPSILON) * 100) / 100`.

### Consecuencias
- Cero desfasajes en subtotales ni totales de pedidos.
- Precisión financiera garantizada en la persistencia.

---

## ADR-004 — Gestión de Claves Primarias (Autoincrementales)

### Contexto
Para facilitar la lectura humana, defensas orales y pruebas sencillas en clase, se prefiere un identificador secuencial y claro.

### Decisión
Utilizar identificadores de enteros autoincrementales (`@default(autoincrement())`) para `Product`, `Order` y `OrderItem`.

### Consecuencias
- Pedidos legibles `#00001`, `#00002`.
- Consultas simples en API REST (`GET /api/orders/1`).

---

## ADR-005 — Máquina de Estados y Gestión Transaccional de Stock

### Contexto
Las confirmaciones y cancelaciones de pedidos afectan directamente el stock de productos y deben ser atómicas para evitar inconsistencias de datos.

### Decisión
- **Confirmación (`PENDING` -> `CONFIRMED`)**: Valida stock en base de datos. Si hay stock suficiente, descuenta el stock y confirma el pedido dentro de una transacción `prisma.$transaction`. Si falla, realiza rollback automático.
- **Cancelación (`CONFIRMED` -> `CANCELLED`)**: Restaura el stock de los productos involucrados dentro de una transacción atómica `prisma.$transaction`.
- **Inmutabilidad**: Los pedidos en estado `DELIVERED` son estrictamente inmutables. Los pedidos en `CANCELLED` son finales.

### Consecuencias
- Transiciones atómicas y seguras ante concurrencia básica.
- Integridad total entre pedido y stock.
