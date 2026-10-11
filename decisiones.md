# Índice

1. [TP1 - Git Colaborativo](#tp1---git-colaborativo)
2. [TP2 — Selección de aplicación: OrderFlow](#tp2--selección-de-aplicación-orderflow)
3. [TP3 - Planificacion DevOps](#tp3---planificacion-devops)
4. [TP4 — CI: Pipelines as Code](#tp4--ci-pipelines-as-code)
5. [TP5 — Calidad automatizada: tests, coverage y el umbral que frena un merge](#tp5--calidad-automatizada-tests-coverage-y-el-umbral-que-frena-un-merge)
6. [TP6 — CD: environments, aprobaciones y deployment patterns](#tp6--cd-environments-aprobaciones-y-deployment-patterns)

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

# TP4 — CI: Pipelines as Code

## 1. **Estructura del pipeline**
- El pipeline se encuentra separado en dos jobs: build-backend y build-frontend, porque ambos componentes tienen procesos de construcción independientes. Al ejecutarse en paralelo se reduce el tiempo total del workflow y además se puede identificar con claridad cuál de los dos componentes falla.

## 2. **Cache**
- El pipeline cachea las capas de las imágenes Docker y el cache de GitHub Actions. Se reutilizan las capas cuyo contenido y dependencias no cambiaron. Si cambia una instrucción o archivo del que depende una capa, esa capa y las siguientes deben reconstruirse. Si el cache desaparece, el pipeline debe seguir funcionando normalmente; simplemente tarda más porque reconstruye todo desde cero.

## 3. **Dockerfile como fuente de verdad**
- El pipeline utiliza los Dockerfiles definidos en el TP2 para mantener una única fuente de verdad sobre cómo se construye la aplicación. Si el pipeline tuviera comandos propios para compilar backend y frontend, existirían dos definiciones distintas del proceso de build que podrían divergir. De esta forma, CI verifica exactamente el mismo proceso que después se utilizará para ejecutar o desplegar la aplicación.

## 4. **Problemas encontrados y soluciones**
- Cuando vi las actions en github, veia que el frontend en la 2da corrida estaba cacheado, pero el backend no, entonces me puse a investigar y encontre que el problema era que en el build-backend me habia olvidado de definir el scope del cache, entonces lo agregue y ahora funciona correctamente. El scope que le puse es el siguiente:

``` bash
cache-from: type=gha,scope=backend
cache-to: type=gha,mode=max,scope=backend
```

## 5. **Uso de IA**
- Use IA para que me ayude a completar la informacion de decisiones.md, porque yo entiendo lo que hace, pero no sabia como explicarlo, entonces le pase la informacion y me ayudo a redactar lo que puse en este archivo. Luego verifique que lo que me devolvio era correcto y entendible, y lo deje asi.

---

# TP5 — Calidad automatizada: tests, coverage y el umbral que frena un merge

## 1. Tabla de equivalencias de stack (NestJS + Vite/Vitest vs .NET)

Como nuestra aplicación no utiliza el stack de la cátedra (.NET + vitest con JS), detallamos las herramientas empleadas en cada aspecto técnico evaluado:

| Requisito / Concepto | Cátedra (.NET + Vite/JS) | Nuestro Stack (NestJS + React/TS/Vitest) |
|---|---|---|
| **Dónde viven los tests** | Proyecto aparte `MiApi.Tests` / `algo.test.js` | Backend: al lado del código en `backend/src/**/*.spec.ts`. Frontend: `frontend/src/**/*.test.ts`. |
| **Test parametrizado** | `[Theory]` + `[InlineData]` | `it.each([...])` tanto en Jest (Backend) como en Vitest (Frontend). |
| **Inyección de dependencias** | Interfaz + constructor | TypeScript Interfaces + Constructor Injection en casos de uso desacoplados de Prisma; paso de cliente por parámetro en frontend (`getActiveProducts(fetcher)`). |
| **Fabricar el doble (mock)** | Moq (`Mock<INotificador>`) | `jest.fn()` / `jest.Mocked<Repository>` en Backend; `vi.fn()` en Frontend. |
| **Medición de cobertura** | Coverlet (`--collect:"XPlat Code Coverage"`) | `jest --coverage` en Backend; `vitest run --coverage` en Frontend. |
| **Umbral que rompe el build** | `coverlet.msbuild` (`/p:Threshold=...`) | `coverageThreshold` en configuración de Jest; `coverage.thresholds` en Vitest. |
| **Qué entra en la cuenta** | `/p:Exclude=...` | `collectCoverageFrom` en Jest (excluyendo arranque `main.ts`, módulos y DTOs); `include` en Vitest. |
| **Reportes legibles** | ReportGenerator (Cobertura $\to$ HTML / Summary) | Repórteres nativos (`lcov`, `json-summary`, `text`, `html`). |
| **Tests en Dockerfile** | `FROM build AS test` con SDK .NET | `FROM builder AS test` heredando Node 20 y dependencias completas (`npm ci`). |

## 2. Qué lógica elegimos testear y por qué ESA (¿dónde duele un bug en OrderFlow?)

OrderFlow es un sistema gestor de pedidos con inventario. En este tipo de sistemas, un fallo en la UI es incómodo pero un fallo en la lógica de negocio nuclear causa pérdidas económicas o inconsistencias irrecuperables. Decidimos testear cuatro reglas críticas:

1. **Regla 1 — Validación y cálculo de items del pedido (`OrderItem`):**
   - *Por qué:* Un precio negativo o una cantidad no entera o menor a 1 altera el inventario o genera importes negativos. Se testea el rechazo de cantidades inválidas (con tests parametrizados `it.each`), precios unitarios $\le 0$ y el redondeo exacto de decimales en subtotales (`unitPrice * quantity`).
2. **Regla 2 — Integridad y composición del pedido (`Order`):**
   - *Por qué:* Un pedido no puede nacer huérfano (sin items), ni con productos duplicados (deben acumularse en un único renglón), ni con un cliente inválido. Se prueban los casos de error de nombre vacío o menor a 2 caracteres y la detección de duplicados.
3. **Regla 3 — Máquina de estados y ciclo de vida (`Order`):**
   - *Por qué:* Romper las transiciones de estado (`PENDING` $\to$ `CONFIRMED` $\to$ `PREPARING` $\to$ `DELIVERED`) permitiría cancelar pedidos ya despachados o entregar pedidos no confirmados. Se verifican las transiciones válidas e invariantes clave: un pedido `DELIVERED` es inmutable y no se puede cancelar, y un pedido `CANCELLED` no puede reactivarse.
4. **Regla 4 — Descuento y restauración transaccional de stock con dependencias externas (`ConfirmOrderUseCase` / `CancelOrderUseCase`):**
   - *Por qué:* Es el punto de mayor dolor operativo. Vender sin stock genera roturas de stock; cancelar sin devolver stock pierde mercadería disponible. Aquí se emplea el **Mock obligatorio** aislando la base de datos y verificando que el caso de uso invoque atómicamente a `confirmWithStockDeduction` con los ítems y cantidades exactas.

En el **Frontend**, se aislaron y testearon las reglas puras equivalentes en `src/utils/order-logic.ts` (sin acoplar a React ni al DOM):
- Test parametrizado (`it.each`) para los permisos de cancelación según el estado del pedido.
- Caso de error para la longitud y presencia del nombre del cliente.
- Cálculo acumulativo del total de pedidos con redondeo a dos decimales.
- Test con **Mock obligatorio** (`vi.fn()`) para la obtención y filtrado de productos activos sin tocar la red.

## 3. Refactorización para poder mockear: qué se cambió y por qué no se podía testear antes

- **En Backend:** Los casos de uso de OrderFlow ya se concibieron aplicando Arquitectura Hexagonal y Principio de Inversión de Dependencias (DIP). `ConfirmOrderUseCase` recibe `OrderRepository` y `ProductRepository` por constructor. Esto evitó tener que instanciar la base de datos real o Prisma dentro del caso de uso. El mock se configuró con `jest.fn()` simulando las consultas y verificando mediante `expect(mockOrderRepository.confirmWithStockDeduction).toHaveBeenCalledWith(...)` que la interacción sucediera con los parámetros correctos.
- **En Frontend:** Anteriormente las funciones en páginas y componentes realizaban llamadas directas a `fetch` o estaban acopladas a la API global (`api.ts`). Siguiendo el ejemplo de la cátedra (§3.0), refactorizamos extrayendo la lógica pura a `frontend/src/utils/order-logic.ts`, donde `getActiveProducts` recibe el cliente HTTP (`fetcher`) como parámetro inyectado. De esta manera, el test unitario puede pasarle un doble de prueba creado con `vi.fn().mockResolvedValue(...)` y verificar que llame a la ruta `/api/products` sin depender de un servidor backend activo.

## 4. Por qué un coverage alto no garantiza calidad (con ejemplo concreto de OrderFlow)

La cobertura de código (*code coverage*) mide únicamente qué porcentaje de las líneas o ramas se **ejecutaron**, pero no si el comportamiento fue **verificado**.

**Ejemplo en OrderFlow:**
Consideremos la función de cálculo del total:
```typescript
export function calculateOrderTotal(items: { unitPrice: number; quantity: number }[]): number {
  if (!items || items.length === 0) return 0;
  const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}
```
Podríamos escribir el siguiente test:
```typescript
it('cobertura sin verdad', () => {
  calculateOrderTotal([{ unitPrice: 100, quantity: 2 }]);
  // No hay ningún expect() o assert
});
```
Al correr la cobertura con Jest o Vitest, este test registrará **100% de line coverage** y **100% de branch coverage** sobre `calculateOrderTotal`. Sin embargo, si mañana un desarrollador introduce un bug y cambia la línea por:
```typescript
const total = items.reduce((acc, item) => acc + item.unitPrice, 0); // ¡Olvidó multiplicar por la cantidad!
```
El test seguirá ejecutándose en **verde**, el pipeline no detectará nada y se desplegará a producción una función que cobra de menos al cliente. Por eso, el coverage es solo un detector de código no ejercitado; la verdadera seguridad reside en la calidad de los asserts, la verificación de casos de borde y los tests de mutación.

## 5. **Umbral de cobertura definido y justificado (Tarea 2)**

- **Umbral elegido:** **70%** tanto para **líneas (lines)** como para **ramas (branches)** en backend y frontend.
- **Valores reales medidos hoy:**
  - **Backend (NestJS + Jest):**
    - Líneas (`lines`): **86.52%**
    - Ramas (`branches`): **74.07%**
    - Funciones (`functions`): **86.66%**
    - Declaraciones (`statements`): **87.31%**
  - **Frontend (React + Vitest):**
    - Líneas (`lines`): **88.13%**
    - Ramas (`branches`): **83.33%**
    - Funciones (`functions`): **100%**
    - Declaraciones (`statements`): **88.13%**

> **Justificación del umbral:**
> Elegimos un umbral del 70% porque nuestra lógica nuclear y de negocio mide actualmente entre el 74% y el 88%. El 70% actúa como una red de seguridad estricta y exigente: si un desarrollador introduce código nuevo sin tests o altera la suite, el coverage cae por debajo de 70% y el build se rompe automáticamente en CI. Al mismo tiempo, evita ser un número arbitrario inalcanzable (Goodhart's Law). Para subir el backend a 85% de ramas, tendríamos que escribir tests de integración adicionales sobre todos los caminos alternativos de los repositorios de persistencia y controladores, que hoy no son objeto de esta suite unitaria.

## 6. **Qué dejamos afuera de la cuenta de cobertura y por qué (Tarea 2)**

Siguiendo el principio de **medir lo que importa (la lógica)** y no el cableado ni clases sin comportamiento (§2.4):

- **En el Backend (NestJS):**
  - **El arranque y configuración:** Excluimos `src/main.ts`, `src/app.module.ts`, `src/config/**` y los módulos (`*.module.ts`). Son archivos de infraestructura y cableado de NestJS; si tienen un error, la app directamente no compila ni levanta.
  - **Clases sin comportamiento:** Excluimos los DTOs (`*.dto.ts`) y esquemas generados por Prisma (`prisma/**`). Son estructuras de datos de transporte sin reglas de validación de negocio complejas.
  - **Adaptadores de entrega e infraestructura:** Excluimos controladores HTTP (`*.controller.ts`), filtros de excepción (`*.filter.ts`) y repositorios concretos de base de datos (`infrastructure/persistence/prisma/**`), ya que su verificación corresponde a pruebas de integración o E2E.
  - *Impacto del recorte:* Medir todo el backend sin filtros arrojaba un 31.4% ficticio. Al excluir el cableado e infraestructura, la cobertura refleja fielmente el 86.5% de la lógica de dominio y aplicación de OrderFlow.
- **En el Frontend (Vite/React):**
  - Excluimos los componentes visuales de React (`pages/`, `components/`) y la inicialización (`main.tsx`, `App.tsx`), ya que testear JSX sin lógica pura agrega acoplamiento innecesario a jsdom/testing-library. La interacción visual completa se evalúa en el TP7 con pruebas end-to-end.
  - Focalizamos el `include` en `src/utils/**`, donde residen las funciones puras de negocio (cálculo de totales, validación de clientes y reglas de transición de estados).

## 7. **El ejercicio de la rama sin cubrir (Tarea 2)**

Analizando el reporte generado por Vitest en el frontend sobre `frontend/src/utils/order-logic.ts`:
1. **Qué línea es:**
   Línea 22 de `src/utils/order-logic.ts`:
   ```typescript
   if (trimmed.length > 100) {
     return {
       isValid: false,
       error: 'El nombre no puede exceder los 100 caracteres.',
     };
   }
   ```
2. **Qué entrada la recorrería:**
   Una cadena con más de 100 caracteres de longitud, por ejemplo: `"A".repeat(101)`.
3. **Qué decidimos:**
   Decidimos **no agregar ese test en esta etapa**. 
   *Motivo:* En el contexto comercial de OrderFlow, los nombres de clientes reales en el formulario raramente exceden los 100 caracteres, y el caso crítico que previene fallos operativos es el límite inferior (`length < 2`), el cual sí está testeado exhaustivamente. La regla superior se mantiene como programación defensiva para evitar desbordes en base de datos.

## 8. **Problemas encontrados y soluciones**

- **Reconocimiento de tipos de Jest en VS Code:** Al abrir el repositorio desde la carpeta raíz (`ingsoft3-tp01`), el servidor de TypeScript de VS Code no asociaba automáticamente las definiciones de tipos globales de `@types/jest` ubicadas en la subcarpeta `backend/node_modules/`, arrojando advertencias en el editor (`Cannot find name 'describe'`, `Cannot find namespace 'jest'`). 
  - *Solución:* Se agregó la directiva `/// <reference types="jest" />` al inicio de los archivos de prueba, se especificó `"types": ["jest", "node"]` en `backend/tsconfig.json` y se garantizó la disponibilidad de `node_modules` local para que el IDE resuelva los tipos sin depender exclusivamente del build de Docker.
- **Diferencia entre métodos de test reales vs. datos parametrizados:** El profesor advirtió explícitamente en clase no utilizar un único test parametrizado con 8 datos para inflar la cuenta de pruebas.
  - *Solución:* Se escribieron **15 métodos de test reales y distintos (`it(...)`)** repartidos en 4 reglas de negocio. El test parametrizado aporta 4 ejecuciones dinámicas sobre un único método, totalizando 18 ejecuciones en consola, superando ampliamente el piso de 8 métodos exigidos.

## 9. **Declaración de uso de IA**

Se utilizó un asistente de inteligencia artificial para:
- Estructurar formalmente los bloques AAA (`// Arrange`, `// Act`, `// Assert`) y la parametrización con `it.each` según las convenciones exigidas por la cátedra.
- Diseñar la inyección de dependencias en `frontend/src/utils/order-logic.ts` para emular el patrón del backend y permitir mockear el cliente HTTP.
- Configurar las etapas de prueba multi-stage en los Dockerfiles y los pasos de extracción de cobertura y reportes en `.github/workflows/ci.yml`.
- Todos los tests, umbrales y scripts fueron ejecutados y validados localmente en contenedores Docker para certificar su correcto funcionamiento y paso en verde.

## 10. **El Quality Gate en acción: evidencia del freno por cobertura (Tarea 3)**

### 1. Evidencia de la falla y bloqueo del Pull Request
- **Pull Request bloqueado por calidad:** [#24](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pull/24)
- **Corrida en rojo (Run ID):** [Actions Run 36289012535](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/36289012535) (Job: [build-frontend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/36289012535/job/108535307409))
- **Commit que introdujo la falla:** `84dade1` (*feat: agregar determinacion de prioridad de pedidos sin tests*)
- **Resultado observado en GitHub Actions:**
  - Los 13 tests existentes pasaron exitosamente (0 errores de código o compilación).
  - La cobertura de líneas cayó a **67.81%**, quedando por debajo del umbral mínimo configurado del **70%**.
  - Vitest (`v1.6.1` con motor `@vitest/coverage-v8`) arrojó el error:
    ```
    ERROR: Coverage for lines (67.81%) does not meet global threshold (70%)
    Error: Process completed with exit code 1.
    ```
  - En GitHub, el check `CI / build-frontend (pull_request)` figuraba como `Required` en rojo (❌), el recuadro informó `Some checks were not successful`, y el botón `Squash and merge` quedó inhabilitado en gris, impidiendo el merge a `main`.

### 2. Métrica por la cual frenó y comportamiento del runner
- **Métrica que disparó el freno:** **Líneas (`lines`)**, cayendo de 88.13% a **67.81%**.
- **Explicación técnica (Vitest v1.6.1):** En esta versión de Vitest con el proveedor V8, las ramas pertenecientes a una función que nunca es invocada por ningún test no se contabilizan inicialmente en el denominador de ramas (permanecieron en 83.33%), pero sí se computan todas sus líneas y sentencias como no cubiertas (`lines = 67.81%`). Al tener configurado el umbral tanto en líneas como en ramas al 70%, el gate frenó inmediatamente por la métrica de líneas.

### 3. Recuperación de la calidad (Rojo $\to$ Verde $\to$ Merge)
- Se identificaron y cubrieron los 6 caminos lógicos declarados por la nueva regla `determineOrderPriority` en `frontend/src/utils/order-logic.test.ts`:
  1. Cliente VIP con total > $50.000 $\to$ `CRITICAL` (12h).
  2. Cliente VIP con total $\le$ $50.000 $\to$ `HIGH` (24h).
  3. Pedido general con total $\ge$ $100.000 $\to$ `HIGH` (24h).
  4. Pedido general con volumen $\ge$ 20 ítems $\to$ `HIGH` (24h).
  5. Pedido general con total entre $20.000 y $99.999 $\to$ `NORMAL` (48h).
  6. Pedido general de bajo monto e ítems reducidos $\to$ `LOW` (72h).
- Tras agregar estos tests, la suite aumentó a 19 tests pasando, la cobertura de líneas subió al **91.95%** y la de ramas al **89.47%**.
- El pipeline volvió a ejecutarse, pasó a **VERDE** (✅), el botón de merge se desbloqueó y la PR fue mergeada a `main`.

### 4. Tabla de enlaces que prueban cada decisión

| Lo que se prueba | Enlace |
|---|---|
| **Resumen de cobertura y reporte descargable (corrida verde)** | [Actions Run 36289371645](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/36289371645) |
| **Corrida roja por umbral (número en el log: 67.81% < 70%)** | [Actions Run 36289012535](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/36289012535) (Job: [build-frontend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/36289012535/job/108535307409)) |
| **Secuencia rojo $\to$ tests $\to$ verde $\to$ merge (PR 1)** | [Pull Request #24](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pull/24) |
| **Freno vigente en rojo para defensa oral (PR 2)** | [Pull Request #25](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pull/25) |

---

# TP6 — CD: environments, aprobaciones y deployment patterns

## Enlaces de este TP

> **Nota:** Conforme al entregable de la cátedra, esta sección reúne todos los accesos externos y corridas requeridas para la corrección y defensa de P2.

| Recurso / Evidencia | Enlace / Identificador | Descripción |
|---|---|---|
| **Paquete Backend (GHCR)** | [ghcr.io/santinoschiavoni/ingsoft3-tp01-backend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) | Imagen pública de backend en GitHub Container Registry, etiquetada por commit (`:sha-<commit>`). Descargable sin credenciales. |
| **Paquete Frontend (GHCR)** | [ghcr.io/santinoschiavoni/ingsoft3-tp01-frontend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) | Imagen pública de frontend en GitHub Container Registry, etiquetada por commit (`:sha-<commit>`). Descargable sin credenciales. |
| **Cadena Eslabón 2: PR saltea registry** | [Actions Run 37405656099](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/37405656099) | Corrida de Pull Request con tests en verde donde el step «Entrar al registry» aparece **salteado** (prueba que solo `main` publica). |
| **Cadena Eslabón 3: Corrida de main** | [Actions Run 37405896826](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/37405896826) | Corrida post-merge en `main` donde se evidencia que «Construir y publicar la imagen...» es el **último paso** del job tras los tests y coverage. |
| **QA - Frontend URL** | [https://orderflow-front-qa.onrender.com](https://orderflow-front-qa.onrender.com) | URL pública del entorno QA servido con Nginx contenedorizado. |
| **QA - Backend / Health URL** | [https://orderflow-api-qa.onrender.com/health](https://orderflow-api-qa.onrender.com/health) | Endpoint `/health` y `/api/products` conectado a la base `app_qa` de Neon. |
| **PROD - Frontend URL** | [https://orderflow-front-prod.onrender.com](https://orderflow-front-prod.onrender.com) | URL pública del entorno de Producción. |
| **PROD - Backend / Health URL** | [https://orderflow-api-prod.onrender.com/health](https://orderflow-api-prod.onrender.com/health) | Endpoint de Producción conectado a la base `app_prod` de Neon. |
| **Release v6.0.0** | *Pendiente cierre del TP (Tarea 5)* | Tag y Release de GitHub con notas generadas desde PRs. |

---

## 1. El artefacto: qué entrega el pipeline y por qué el registry es confiable (Tarea 1)

### 1.1 ¿Por qué el artefacto nace sólo de un build verde?
Hasta el TP5, el pipeline era meramente de **verificación**: construía, ejecutaba tests, evaluaba el umbral de cobertura y finalizaba. Al apagarse el runner, la imagen construida se destruía. 

Un pipeline que no produce un artefacto desplegable es sólo compilación y testeo, no integración continua real. Para que el proceso de despliegue sea confiable, debe existir una unidad concreta e inmutable que pueda ser transportada a los entornos sin necesidad de reconstruirla.

El artefacto **nace de un build verde o no nace**:
- Si publicáramos imágenes ante tests fallidos, el registry se convertiría en un depósito arbitrario de binarios rotos y la etiqueta de publicación perdería su significado de garantía de calidad.
- Al condicionar la publicación a la verificación exitosa, estar publicado en `ghcr.io` garantiza contractualmente: *«este código pasó la suite completa de pruebas y el umbral de cobertura sin errores»*.

### 1.2 La cadena de tres eslabones que garantiza la confiabilidad
Para asegurar que ninguna imagen rota llegue al registry sin necesidad de pruebas manuales o configuraciones complejas, se implementó una cadena de tres eslabones autoportante:

1. **Primer eslabón — Nada entra a `main` sin el pipeline en verde:**
   - La rama `main` está protegida mediante el branch protection rule del TP4 y el Quality Gate del TP5 (umbral de 70% de coverage). No es posible realizar un merge si la suite de tests falla.
2. **Segundo eslabón — Sólo lo que entra a `main` se publica:**
   - En el step `Entrar al registry` se condiciona con `if: github.event_name == 'push'`.
   - En el step `Construir y publicar la imagen` se utiliza:
     ```yaml
     push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
     ```
   - En los Pull Requests el código se construye y verifica, pero el push está desactivado.
   - **Evidencia:** [Actions Run 37405656099](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/37405656099), donde se observa el step de autenticación al registry salteado a pesar de tener los tests aprobados.
3. **Tercer eslabón — El paso que publica es el ÚLTIMO del job:**
   - En GitHub Actions, los pasos de un job se ejecutan secuencialmente y abortan inmediatamente ante el primer error (código de salida $\ne 0$).
   - Al ubicar la construcción y publicación final debajo de los tests y sin condicionales de tipo `always()` o `!cancelled()`, si los tests fallan, el step de publicación **nunca llega a ejecutarse**.
   - **Evidencia:** [Actions Run 37405896826](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/37405896826), donde se comprueba el orden exacto de ejecución en `main`.

> **Garantía del pipeline vs. alcance físico:**
> Esta cadena garantiza que **el pipeline** nunca publicará por accidente una imagen no verificada. No impide que alguien con permisos haga un `docker push` manual desde su máquina local, pero formaliza el proceso automatizado del repositorio.

### 1.3 Identificación y nombrado de la imagen
Las imágenes se publican bajo el esquema:
`ghcr.io/santinoschiavoni/ingsoft3-tp01-<servicio>:sha-<commit>`

- **Trazabilidad por commit (`:sha-${{ github.sha }}`):** Permite vincular de forma biunívoca la imagen en ejecución con el código exacto y el run de CI que la originó. Responde con certeza técnica a la pregunta: *«¿lo que está corriendo en producción es lo que se verificó en este commit?»*.
- **Restricción de minúsculas en GHCR:** El nombre del repositorio (`SantinoSchiavoni/ingsoft3-tp01`) contiene mayúsculas. Dado que la especificación de Docker y GitHub Packages rechaza mayúsculas con el error `repository name must be lowercase`, se explicitó el namespace en minúsculas (`santinoschiavoni`), evitando fallos en la publicación.

---

## 2. Continuous Delivery vs. Continuous Deployment

### 2.1 Comparación conceptual
- **Continuous Integration (CI):** El código se integra frecuentemente y se verifica automáticamente (build + tests + análisis estático). Finaliza con la generación de un artefacto validado en el registry.
- **Continuous Delivery (CD):** Todo cambio verificado queda en estado **listo para desplegarse**, llegando de forma automática a entornos intermedios (QA/Staging), pero el paso final a Producción requiere una **autorización o decisión humana explícita**. El despliegue es una decisión de negocio.
- **Continuous Deployment:** Todo cambio que aprueba los tests pasa directamente a Producción sin intervención humana. Requiere un nivel muy alto de madurez en tests (unitarios, integración, E2E, performance) y observabilidad automática con capacidad de autorecuperación.

### 2.2 Elección para OrderFlow: Continuous Delivery
Para el contexto de OrderFlow adoptamos **Continuous Delivery**:
1. QA se despliega de forma automática e inmediata ante cada merge en `main`.
2. Producción queda retenida tras un **Gate Humano (Environment protection rule con required reviewers)**.
3. *Justificación:* Al tratarse de un sistema transaccional de stock y facturación de pedidos, poner cambios en producción sin control de horario o revisión de negocio podría interrumpir operaciones activas. El gate humano permite coordinar ventanas de mantenimiento y verificar la estabilidad en QA antes de impactar a los usuarios finales.

### 2.3 Desacoplamiento entre Deploy y Release
- **Deploy (Desplegar):** Es la acción técnica de instalar y ejecutar nuevos binarios o contenedores en los servidores.
- **Release (Publicar / Liberar):** Es el acto de negocio mediante el cual se expone una nueva funcionalidad a los usuarios.
- Con técnicas como **Feature Flags** es posible desplegar código en producción manteniéndolo inactivo, desacoplando el riesgo técnico de la infraestructura del riesgo del lanzamiento comercial.

---

## 3. Arquitectura de despliegue y separación de entornos (Tareas 2 y 3)

### 3.1 Base de datos aislada por entorno (Neon)
Para cumplir con el principio de que QA y Producción sean entornos formalmente separados y representativos de la realidad:
- Se crearon dos bases de datos independientes sobre el mismo proyecto serverless de Neon: **`app_qa`** y **`app_prod`**.
- Cada entorno posee su propia Connection String (`DATABASE_URL`), garantizando que las pruebas en QA nunca contaminen los datos de producción.

### 3.2 Elección de infraestructura de datos: ¿Por qué Neon y no Render Postgres?
Elegir infraestructura también implica leer la letra chica de los contratos y tiers gratuitos:
- **Postgres de Render:** Su plan gratuito tiene una vigencia máxima de **30 días** desde su creación (más 14 días de gracia antes de su eliminación total). Esto es insuficiente para la duración del semestre y provocaría la caída de la base de datos antes de la defensa final de P2.
- **Neon:** Ofrece un tier gratuito **permanente** para PostgreSQL serverless (con límites razonables de 0.5 GB de almacenamiento y suspensión de cómputo a los 5 minutos de inactividad que se reanuda de forma transparente ante la primera consulta).
- *Decisión:* Se desacopla la capa de persistencia de Render y se delega en Neon, asegurando que los entornos sigan vivos y operativos sin requerir tarjeta de crédito ni recreaciones mensuales forzadas.

### 3.3 Creación y migración de esquemas en NestJS + Prisma
A diferencia de la app de cátedra en .NET que utiliza `EnsureCreated()`, en OrderFlow:
- El contenedor backend ejecuta en su `docker-entrypoint.sh`:
  ```sh
  npx prisma migrate deploy
  ```
- Al iniciar el servicio por primera vez en Render, Prisma ejecuta automáticamente las migraciones pendientes sobre la base correspondiente (`app_qa` o `app_prod`), creando las tablas `products`, `orders` y `order_items` e inicializando el seed si la base está vacía.

### 3.4 Desacoplamiento de la URL del Backend en el Frontend (Plantilla Nginx)
- En el TP2, `nginx.conf` tenía fija la dirección del backend de compose (`http://backend:3000`). En la nube, las URLs de QA y PROD son completamente distintas (`orderflow-api-qa.onrender.com` vs `orderflow-api-prod.onrender.com`).
- Hornear la URL en la imagen o en el build de Vite invalidaría el principio de **promover el mismo artefacto inmutable** entre entornos.
- **Solución implementada:** Se transformó la configuración en `frontend/default.conf.template` ubicada en `/etc/nginx/templates/`. Al arrancar el contenedor, el entrypoint de Nginx sustituye automáticamente las variables `${BACKEND_URL}` y `${DNS_RESOLVER}` por las variables de entorno inyectadas por el proveedor:
  - En Compose local: `BACKEND_URL=http://backend:3000` y `DNS_RESOLVER=127.0.0.11`
  - En Render QA: `BACKEND_URL=https://orderflow-api-qa.onrender.com` y `DNS_RESOLVER=8.8.8.8`
  - En Render PROD: `BACKEND_URL=https://orderflow-api-prod.onrender.com` y `DNS_RESOLVER=8.8.8.8`
- Se incluye `proxy_ssl_server_name on;` para habilitar correctamente el SNI de TLS hacia las URLs HTTPS de Render.

### 3.5 Promoción automática a QA y el valor crítico de `&ref=$GITHUB_SHA`
- El job `deploy-qa` se encadena mediante `needs: [build-backend, build-frontend]` y `if: github.ref == 'refs/heads/main'`, garantizando que sólo el código validado se promueva.
- **Por qué `&ref=$GITHUB_SHA` es el corazón del práctico:**
  - Si se invocara el Deploy Hook pelado (`$HOOK_API`), Render desplegaría por defecto la punta de la rama (`HEAD` de `main`).
  - Ante dos merges concurrentes o sucesivos, la corrida del primer commit podría terminar desplegando el código del segundo commit antes de que este fuera validado.
  - Al concatenar `&ref=$GITHUB_SHA`, se instruye a Render a desplegar **exactamente el commit que acaba de verificar el pipeline**.
- **Smoke test resiliente con reintentos:**
  - Debido al *cold start* y tiempo de compilación del free tier de Render (de 2 a 5 minutos), un chequeo simple de HTTP fallaría de inmediato.
  - El smoke test ejecuta un bucle de hasta 30 intentos espaciados cada 20 segundos con `--max-time 10`.
  - Se verifican 3 condiciones simultáneas: proceso vivo (`/health`), conexión efectiva a la base de datos (`/api/products`), y entrega correcta del frontend (`/`).

---

## 4. El gate humano y los criterios de aprobación (Tarea 4)

### 4.1 ¿Por qué frenar la máquina antes de Producción? (Continuous Delivery vs Deployment)
Frenar el flujo automático justo antes de Producción introduce un control de negocio que la automatización pura no puede reemplazar:
- **Timing y oportunidad de negocio:** Permite sincronizar el despliegue con momentos de bajo impacto para los usuarios (fuera de horarios pico), coordinar anuncios con el equipo de producto o soporte y asegurar disponibilidad del equipo ante incidentes.
- **Contexto humano y verificación de QA:** El aprobador no aprueba a ciegas ni por inercia; analiza la evidencia del entorno de QA (si el smoke test pasó sin demoras, si la interfaz visual es consistente y si los logs muestran anomalías).
- **Responsabilidad explícita y trazabilidad:** En GitHub Actions queda registrado de forma indeleble quién aprobó el despliegue, en qué fecha/hora y qué notas acompañaron la decisión. «¿Quién autorizó esto?» tiene respuesta verificable en la corrida.
- **Alcance de los secretos de producción:** Los Deploy Hooks (`RENDER_HOOK_API_PROD` y `RENDER_HOOK_FRONT_PROD`) residen **exclusivamente dentro del environment `production`**. Ningún job sin aprobación humana previa puede acceder a estas credenciales, protegiendo los entornos productivos de accesos no autorizados.

### 4.2 Criterios formales del aprobador (qué se mira antes de aprobar)
Aprobar por mero trámite debilita el gate. El revisor debe validar cuatro condiciones estrictas antes de pulsar *Approve and deploy*:
1. **Verificación técnica completa en verde:** El pipeline de CI (`build-backend` y `build-frontend`) y el despliegue automático `deploy-qa` deben haber finalizado con éxito.
2. **Smoke test de QA superado sin anomalías:** El smoke test de QA no debe haber requerido un número inusual de reintentos (síntoma de degradación en base de datos o cold start crítico).
3. **Inspección del cambio:** Revisar el Pull Request para constatar que no existan migraciones destructivas de base de datos ni rotura de contratos de API no contemplados.
4. **Ventana operativa adecuada:** Que no existan despliegues concurrentes pendientes de resolución o que no sea un horario crítico de atención comercial.

### 4.3 Evidencia de aprobación y rechazo documentado
Un gate que nunca rechaza no es una compuerta: es un decorado. Por ende, el flujo contempla y documenta ambos caminos:
- **Flujo de rechazo con motivo específico (Evidencia obligatoria):**
  - *Corrida rechazada:* *(Se adjuntará el enlace tras ejecutar la prueba)*
  - *Motivo documentado:* Se rechazó la corrida debido a una condición operativa puntual (por ejemplo: revisión pendiente en el esquema de base de datos / ventana de mantenimiento cerrada / validación manual requerida en QA).
- **Flujo de aprobación exitosa:**
  - *Corrida aprobada:* *(Se adjuntará el enlace tras aprobar el segundo PR)*
- **Control de concurrencia:**
  - El job `deploy-prod` define:
    ```yaml
    concurrency:
      group: deploy-prod
      cancel-in-progress: false
    ```
  - Esto evita que dos despliegues a producción se pisen entre sí en Render. Sin embargo, no reordena aprobaciones pendientes, por lo que la regla de equipo es rechazar manualmente cualquier corrida vieja antes de autorizar una nueva.

---

## 5. Letra chica del Free Tier y limitaciones del pipeline

### 5.1 Restricciones de Render y Neon
El diseño de pipelines y entornos en la nube exige comprender el contrato del proveedor:
- **Render Web Services (Free Tier):**
  - Otorga **750 horas de cómputo por mes para todo el workspace** (consumidas entre los cuatro servicios: 2 en QA y 2 en PROD).
  - Tras 15 minutos sin tráfico, el servicio entra en **estado dormido (sleep)**. La primera petición entrante sufre un **cold start** de hasta 50-60 segundos.
  - Ofrece **500 minutos de build al mes por workspace**. Cada deploy reconstruye los contenedores en Render, consumiendo minutos de cómputo del cupo.
- **Neon Serverless PostgreSQL:**
  - Tier gratuito permanente sin vencimiento de 30 días (a diferencia de Render Postgres).
  - Suspende el cómputo tras 5 minutos de inactividad, reactivándose automáticamente en 1-2 segundos al recibir tráfico SQL. Límite de 0.5 GB de almacenamiento.

### 5.2 Manejo de la latencia en el pipeline
- Para evitar falsos negativos en CI/CD por culpa de los cold starts, los smoke tests de QA y PROD no ejecutan un simple `curl` aislado.
- Implementan un ciclo de **hasta 30 reintentos con esperas de 20 segundos** y un límite de conexión `--max-time 10`, otorgando hasta 10 minutos de ventana para que Render complete el build y despierte la aplicación.

### 5.3 Limitaciones del pipeline actual (y qué resuelve el TP7)
1. **Reconstrucción desde el repositorio en vez de ejecutar la imagen del registry:**
   - En este TP, el deploy hook de Render (`&ref=$GITHUB_SHA`) le solicita a Render que **vuelva a construir** la aplicación desde el repositorio en ese commit.
   - Aunque se despliega el commit verificado, **no se ejecuta físicamente la misma imagen que pasó los tests en GitHub Actions**. Si una dependencia externa no fijada varió entre ambos momentos, la imagen de producción podría diferir. Esta limitación se resuelve en el TP7 al hacer que el proveedor despliegue directamente la imagen publicada en GHCR.

### 5.4 Qué prueba nuestro smoke test y qué NO prueba (limitación honesta)
Todo pipeline profesional debe reconocer con honestidad sus propios límites:

* **Qué SÍ prueba:**
  - **Proceso vivo:** Que el servidor Node/NestJS levantó y responde (`/health`).
  - **Base de datos conectada:** Que la base de Neon responde consultas reales (`/api/products`). Si la cadena de conexión tuviera credenciales inválidas o la base estuviera caída, el smoke fallaría.
  - **Servidor web del front:** Que Nginx sirve correctamente el bundle estático en la raíz (`/`).
  - **Tolerancia a cold start:** Tolera los tiempos muertos del plan gratuito mediante el bucle de 30 reintentos.

* **Qué NO prueba (la limitación):**
  - **No garantiza qué versión específica está atendiendo los pedidos.**
  - Al disparar el deploy hook, Render contesta `200 OK` en menos de un segundo y arranca a compilar en segundo plano (tardando entre 2 y 5 minutos). Durante todo ese tiempo, **Render sigue sirviendo la versión anterior**.
  - Si el servicio no estaba dormido, el smoke test puede dar **verde a los 30 segundos contra la versión VIEJA**, creyendo que el deploy terminó cuando en realidad Render sigue compilando. Y si ese build de Render llegara a fallar, el pipeline marcaría éxito cuando el entorno nunca se actualizó.

* **La solución técnica ideal (mitigación profesional):**
  - Para que el smoke test sea infalible, el backend debería recibir el `$GITHUB_SHA` como variable de entorno durante su construcción y exponerlo en el endpoint:
    ```json
    { "status": "ok", "commit": "a1b2c3d..." }
    ```
  - Luego, el script del smoke test debería comparar ese valor con `$GITHUB_SHA`, fallando y reintentando hasta que el commit que conteste sea estrictamente el recién desplegado. (Otra opción equivalente es consultar la API de Render para esperar el estado `live` del ID de deploy).
  - Reconocer esta brecha entre "el servicio responde 200" y "el servicio está corriendo mi commit" es precisamente lo que separa un pipeline decorativo de uno con criterio de ingeniería.

---

## 6. Estrategia de deployment en producción real y plan de rollback (Tarea 6)

### 6.1 Estrategia de Deployment recomendada para OrderFlow: Blue-Green Deployment
Al analizar las distintas estrategias de despliegue para una aplicación productiva de gestión de pedidos:
- **Recreate:** Requiere apagar la versión vieja antes de encender la nueva, generando downtime inadmisible para clientes procesando compras.
- **Rolling:** Reemplaza instancias gradualmente. Sin embargo, en OrderFlow convivirían simultáneamente dos versiones distintas del backend atendiendo peticiones, lo cual es de alto riesgo cuando una versión introduce cambios transaccionales en la tabla `orders` o en el cálculo de stock.
- **Canary:** Desvía un porcentaje mínimo de tráfico a la versión nueva. Requiere observabilidad avanzada y monitoreo de tasa de errores en tiempo real (métricas APM que hoy no están integradas en el pipeline).
- **Elección: Blue-Green Deployment:**
  - Se mantienen dos entornos de producción idénticos (Blue activo, Green pasivo).
  - El deploy se realiza sobre Green sin afectar a los usuarios. Se ejecutan smoke tests completos contra la base productiva.
  - El router / balanceador conmuta el 100% del tráfico instantáneamente de Blue a Green.
  - **Ventaja de Rollback:** En caso de falla catastrófica post-lanzamiento, el rollback consiste simplemente en re-conmutar el router a Blue en segundos, minimizando el Mean Time to Recovery (MTTR - métrica DORA).

### 6.2 Plan de Rollback actual (Paso a paso)
Si un despliegue aprobado en Render introduce un fallo crítico no detectado, el procedimiento formal de rollback es:

1. **Identificar el último commit estable:**
   - Consultar la última release estable o el commit del deploy previo en *Deployments → production* de GitHub (ej: `SHA_ANTERIOR=$(git rev-list -n1 v5.0.0)` o el commit previo al fallo).
2. **Disparar los Deploy Hooks apuntando al SHA anterior:**
   - Desde la terminal o un script seguro, invocar los hooks de producción especificando el commit anterior:
     ```bash
     curl -fsS "$HOOK_API_PROD&ref=$SHA_ANTERIOR"
     curl -fsS "$HOOK_FRONT_PROD&ref=$SHA_ANTERIOR"
     ```
3. **Monitoreo en Render:**
   - Abrir el panel de Render en los servicios de Producción y monitorear la pestaña *Deploys* hasta que el commit anterior figure con estado **Live**.
4. **Verificación de sanidad:**
   - Ejecutar el smoke test contra la API y el Frontend de Producción para constatar la recuperación del servicio.

> **Lo que el rollback de código NO deshace:**
> El rollback revierte los contenedores y el código de la aplicación, pero **no revierte modificaciones destructivas en los datos de la base de datos**. Si una migración eliminó una columna o alteró datos persistidos, el rollback de infraestructura debe complementarse con un restore de snapshot o migración inversa de datos en Neon.

---

## 7. Problemas encontrados y soluciones

1. **Mayúsculas en el namespace de GHCR:**
   - *Problema:* El repositorio `SantinoSchiavoni/ingsoft3-tp01` contiene letras mayúsculas. Docker y `ghcr.io` rechazan nombres con mayúsculas arrojando `repository name must be lowercase`.
   - *Solución:* Se forzó el namespace en minúsculas en el workflow (`santinoschiavoni`) en lugar de usar `${{ github.repository }}`.
2. **Desacoplamiento de la API en el contenedor de Frontend:**
   - *Problema:* El frontend en local usaba proxy a `http://backend:3000`. En Render, cada entorno tiene un subdominio HTTPS independiente.
   - *Solución:* Se adoptó la plantilla `frontend/default.conf.template` en `/etc/nginx/templates/` resolviendo dinámicamente `${BACKEND_URL}` y activando `proxy_ssl_server_name on;` para soportar SNI TLS.
3. **Manejo de migraciones en Neon sin tarjetas ni intervenciones manuales:**
   - *Problema:* Las bases de Neon nacen vacías y Render Postgres expira a los 30 días.
   - *Solución:* Se utilizó Neon con dos bases (`app_qa` y `app_prod`) y se garantizó la ejecución automática de `npx prisma migrate deploy` en el arranque del contenedor de backend mediante `docker-entrypoint.sh`.

---

## 8. Declaración de uso de IA

Se utilizó asistencia de IA como pair programmer para:
- Adaptar la plantilla de configuración de Nginx y el script de smoke test a los endpoints específicos de OrderFlow (`/api/products`).
- Configurar las etapas del pipeline en `.github/workflows/ci.yml` asegurando la sintaxis de GitHub Environments y la inyección de `&ref=$GITHUB_SHA`.
- Estructurar y documentar las decisiones técnicas y de arquitectura en `decisiones.md`.
- Toda la configuración técnica, secrets, bases de datos y despliegues fueron configurados, validados y comprobados en vivo en las consolas de GitHub, Render y Neon.

