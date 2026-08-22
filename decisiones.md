# Índice

1. [TP1 - Git Colaborativo](#tp1---git-colaborativo)
2. [TP2 — Selección de aplicación: OrderFlow](#tp2--selección-de-aplicación-orderflow)
3. [TP3 - Planificacion DevOps](#tp3---planificacion-devops)

---

# TP1 - Git Colaborativo
## 1. Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.

Git no pudo resolver el conflicto por si solo ya que primero subimos los cambios desde la rama 'feature/titulo-a' y modificamos la linea 1 del readme, subimos los cambios a 'main', y no sucede nada porque fue el primer cambio en agregarse. Luego cuando quisimos subir los cambios desde la rama 'feature/titulo-b', la misma estaba desactualizada con la rama 'main' y encima ambas ramas modificaron la misma linea de codigo, entonces desde el editor tuvimos q resolver el conflicto(tambien se puede hacer desde terminal y en nuestro editor de codigo, haciendo git pull origin main en la rama y solucionando conflicto)
Para que nunca apareciera el conflicto, ambas ramas no deberian modificar la misma linea de codigo, entonces por mas que este desactualizada, no hay conflicto entre los 2 cambios

## 2. Qué problemas encontraste y cómo los solucionaste. Los tropiezos bien contados valen más que un camino perfecto: son los que demuestran que entendiste.

El mayor problema que encontre fue el siguiente, como yo tengo 2 cuentas operativas de github (mia personal UCC y cuenta que me brindo la empresa donde trabajo) se me genero un conflicto de cual estaba configurada globalmente, entonces cuando quise subir los primeros cambios no me permitia porque tenia la otra cuenta(trabajo).
Yo para clonar el repo y acceder vengo utilizando ssh, entonces le pregunte a chatgpt como solucionar eso, porque no me acordaba como hacer para cambiar de clave. Dejo a continuacion los comandos que corri para solucionar el conflicto

```bash
ls -la ~/.ssh
ssh -T -i ~/.ssh/{clave} -o IdentitiesOnly=yes git@github.com
git remote set-url origin git@github-ucc:SantinoSchiavoni/ingsoft3-tp01.git
git remote -v
ssh -T git@github-ucc
```

## 3. Declaración de uso de IA: qué partes hiciste con ayuda de inteligencia artificial y cómo verificaste lo que te devolvió (§ Uso de IA del enunciado).

Como mencione arriba, use IA para solucionar ese conflicto, no para resolver el ejercicio, ya que sabia como manejar PR y conflictos.

# TP2 - Selección de aplicación: OrderFlow

## Aplicación elegida

**OrderFlow** es un gestor interno de productos y pedidos. Permite administrar productos, crear pedidos y recorrer su ciclo de vida (`PENDING`, `CONFIRMED`, `PREPARING`, `DELIVERED` o `CANCELLED`), manteniendo el stock consistente.

## Criterios de selección

- **Ejecución local:** la aplicación se levanta con `docker compose up --build`, incluyendo PostgreSQL, backend y frontend. También puede ejecutarse manualmente con Node.js y una instancia de PostgreSQL.
- **Tests:** el backend contiene pruebas unitarias del dominio y de casos de uso con Jest; el frontend cuenta con pruebas con Vitest.
- **Comprensión y modificación:** el backend usa una separación explícita entre dominio, aplicación, infraestructura y presentación, por lo que las reglas de negocio y sus cambios son fáciles de localizar y explicar en una defensa.
- **Alcance:** contiene un CRUD de productos y las pantallas de listado, creación y detalle de pedidos. El tamaño es deliberadamente acotado para poder evolucionarlo durante el semestre.
- **Aplicación individual:** OrderFlow es una aplicación propia, elegida para este repositorio y esta cursada.

## ADR-001 — Stack tecnológico principal

### Contexto

Se requiere una aplicación full-stack pequeña, clara, fuertemente tipada y mantenible para Ingeniería de Software III.

### Decisión

- Frontend: React + TypeScript + Vite.
- Backend: NestJS + TypeScript.
- Base de datos: PostgreSQL 16.
- ORM: Prisma.

### Consecuencias

- Se utiliza TypeScript en frontend y backend.
- El tipado reduce errores de integración y evita el uso de `any`.
- Vite permite builds rápidos y el stack mantiene una complejidad adecuada para el proyecto.

## ADR-002 — Arquitectura hexagonal / Clean Architecture liviana

### Contexto

Se necesita desacoplar las reglas de negocio de NestJS, Prisma y HTTP para poder probarlas sin dependencias externas y facilitar su comprensión.

### Decisión

El backend se organiza en cuatro capas:

1. **Domain:** entidades, enums, errores e interfaces de repositorio sin dependencias de NestJS o Prisma.
2. **Application:** casos de uso que coordinan reglas y repositorios.
3. **Infrastructure:** adaptadores concretos de persistencia con Prisma y transacciones.
4. **Presentation:** DTOs y controladores HTTP de NestJS.

### Consecuencias

- Las reglas de negocio son testeables sin levantar HTTP ni PostgreSQL.
- La infraestructura puede cambiarse sin alterar el dominio.

## ADR-003 — Manejo de dinero y decimales

### Contexto

Los números de punto flotante de JavaScript pueden introducir errores de redondeo.

### Decisión

PostgreSQL persiste importes como `decimal(12,2)` mediante el tipo `Decimal` de Prisma. En el dominio, los cálculos se redondean a dos decimales con `Math.round((amount + Number.EPSILON) * 100) / 100`.

### Consecuencias

- Los valores almacenados de precios, subtotales y totales conservan dos decimales.
- Los cálculos de pedidos evitan errores habituales de punto flotante a la precisión que requiere la aplicación.

## ADR-004 — Claves primarias autoincrementales

### Contexto

Para facilitar lectura, pruebas y defensa oral se priorizan identificadores simples.

### Decisión

`Product`, `Order` y `OrderItem` utilizan enteros autoincrementales.

### Consecuencias

- Los pedidos e integraciones REST se identifican de manera directa, por ejemplo `GET /api/orders/1`.

## ADR-005 — Máquina de estados y gestión transaccional de stock

### Contexto

Confirmar o cancelar un pedido modifica el stock y requiere mantener la consistencia de los datos.

### Decisión

- Al confirmar un pedido, se valida disponibilidad y se descuenta stock dentro de una transacción Prisma.
- Al cancelar un pedido confirmado, se restaura el stock dentro de una transacción Prisma.
- Un pedido entregado es inmutable y un pedido cancelado es final.
- En Docker, al iniciar el backend se ejecutan migraciones y se cargan datos de ejemplo solo cuando la base está vacía. Esta facilidad está pensada para desarrollo local; no se aplicará como estrategia de producción.

### Consecuencias

- Las transiciones de estado y los cambios de stock son atómicos para el caso de uso previsto.
- El entorno local queda listo para usar con un único comando.

# TP3 - Planificacion DevOps
## Duracion del Sprint
- Elegi una duracion de **2 semanas** para el sprint porque me permite trabajar con objetivos acotados, poder estar encima del proyecto pero no a las corridas por terminar. Me permite tambien ser mas flexible frente a los cambios de los Trabajos Practicos, y darme flexibilidad si un trabajo me lleva un poco mas de tiempo.

## Límite de trabajo en progreso y su porqué.
- Para el limite del trabajo en progreso elegi **2 tareas en simultaneo**, porque siguiendo el calculo que vimos en el video (numero de personas involucradas + 1) lo que me da un resultado de 2.

## El diagnóstico de la historia mal escrita 
- La historia está mal escrita porque describe una implementación técnica (“crear la tabla usuarios”) en lugar de una necesidad. En realidad, eso debería ser una tarea dentro de una historia.
- Yo la HU la reescribiria asi: **"Como administrador quiero poder gestionar las cuentas de los usuarios para controlar sus accesos al sistema y sus permisos."** Luego si agregaria una tarea mas vinculada a la parte tecnica, algo como **"crear tabla usuarios"**.

## Problemas encontrados
- El unico problema q encontre es que no tenia `gh` instalado en mi maquina, por lo que tuve que instalarlo y loguearme primero para poder hacer los comandos por terminal

## Uso de IA
- En este TP, no utilice IA para el desarrollo del mismo, solamente para consultarle que opinaba de mi HU y mejorarla, pero le gusto lo que propuse, entonces lo use como validacion a lo que habia pensado.
- Lo que si use IA para armar un indice aca en decisiones,asi es mas legible