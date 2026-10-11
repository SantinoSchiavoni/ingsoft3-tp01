# Índice

1. [TP1 - Git Colaborativo](#tp1---git-colaborativo)
2. [TP2 — Selección de aplicación: OrderFlow](#tp2--selección-de-aplicación-orderflow)
3. [TP3 - Planificacion DevOps](#tp3---planificacion-devops)
4. [TP4 — CI: Pipelines as Code](#tp4--ci-pipelines-as-code)
5. [TP5 — Calidad automatizada: tests, coverage y el umbral que frena un merge](#tp5--calidad-automatizada-tests-coverage-y-el-umbral-que-frena-un-merge)
6. [TP6 — CD: environments, aprobaciones y deployment patterns](#tp6--cd-environments-aprobaciones-y-deployment-patterns)
7. [TP7 — Contenedores en el pipeline + integración y e2e](#tp7--contenedores-en-el-pipeline--integración-y-e2e)

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
| **Release v6.0.0** | [Release v6.0.0](https://github.com/SantinoSchiavoni/ingsoft3-tp01/releases/tag/v6.0.0) | Tag y Release oficial de GitHub con notas generadas automáticamente a partir de los PRs mergeados. |

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

### 1.3 Identificación y nombrado de la imagen: Tags vs. Digests
Las imágenes se publican bajo el esquema:
`ghcr.io/santinoschiavoni/ingsoft3-tp01-<servicio>:sha-<commit>`

- **Dos paquetes por arquitectura desacoplada:** OrderFlow se compone de dos componentes independientes con ciclos de vida y stacks diferenciados: `backend` (NestJS/Node/Prisma) y `frontend` (React/Vite/Nginx). Cada uno posee su propio Dockerfile multi-stage y genera su propio paquete público en GHCR.
- **Trazabilidad por commit (`:sha-${{ github.sha }}`):** Permite vincular de forma biunívoca la imagen en ejecución con el código exacto y el run de CI que la originó. Responde con certeza técnica a la pregunta: *«¿lo que está corriendo en producción es lo que se verificó en este commit?»*.
- **Restricción de minúsculas en GHCR:** El nombre del repositorio (`SantinoSchiavoni/ingsoft3-tp01`) contiene mayúsculas. Dado que la especificación de Docker y GitHub Packages rechaza mayúsculas con el error `repository name must be lowercase`, se explicitó el namespace en minúsculas (`santinoschiavoni`), evitando fallos en la publicación.

> **Profundización técnica — Tag vs. Digest (Criterio de excelencia en Supply Chain):**
> - **El Tag (`:sha-<commit>`):** Es una referencia simbólica legible para humanos. Si bien en nuestro pipeline cada tag representa un commit único de git, **los tags de Docker son mutables por diseño**. Un usuario con permisos de escritura o una mala configuración en el CI podría forzar un push sobre el mismo tag y reemplazar la imagen.
> - **El Digest (`@sha256:<hash>`):** Es el hash criptográfico del manifiesto de la imagen (content-addressable identifier). Es **matemáticamente inmutable**: si un solo byte de la imagen varía, el digest cambia por completo.
> - *Implicancia en producción:* Para garantizar inmutabilidad absoluta y protegerse contra ataques de cadena de suministro (Supply Chain Attacks), plataformas orquestadoras como Kubernetes o AWS ECS en entornos bancarios despliegan referenciando el digest (`image@sha256:...`) en lugar de tags mutables.

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

> **Comprobación empírica de aislamiento (pregunta de defensa):**
> Para verificar que no se cometió el error silencioso de copiar la misma connection string en ambos entornos de Render, se realizó la siguiente prueba en 30 segundos:
> 1. En Neon SQL Editor, se seleccionó la base `app_prod` y se insertó un producto único identificable:
>    `INSERT INTO products (name, description, price, stock, active) VALUES ('SOLO EN PROD', 'Verificacion aislamiento', 999.00, 10, true);`
> 2. Se abrió la URL pública de la API de PROD (`https://orderflow-api-prod.onrender.com/api/products`) y el producto figuraba en la lista.
> 3. Se abrió la URL pública de la API de QA (`https://orderflow-api-qa.onrender.com/api/products`) y el producto **no figuraba**.
> Esto demuestra empíricamente que cada entorno ataca exclusivamente a su propia base de datos física.

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

**Qué quedó adentro de la imagen vs. qué quedó afuera por variable:**
* **Adentro de la imagen (inmutable):** Los estáticos compilados de React (`dist/`), el servidor web Nginx y la plantilla `/etc/nginx/templates/default.conf.template`.
* **Afuera de la imagen (por variable de entorno):** `${BACKEND_URL}` y `${DNS_RESOLVER}`.
- **Solución implementada:** Al arrancar el contenedor, el entrypoint nativo de Nginx sustituye automáticamente las variables por las inyectadas por el proveedor:
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

> **Qué NO puede ver el aprobador (brecha de observabilidad actual):**
> Un análisis honesto del gate revela que el aprobador cuenta con visibilidad limitada:
> - **Solo observa resultados binarios (éxito/fracaso):** Sabe si el smoke test pasó o falló, pero no tiene métricas de rendimiento en tiempo real (latencia percentil 95/99, throughput de transacciones).
> - **Falta de APM y tracing distribuido:** No se cuenta con herramientas de monitoreo en tiempo real (Datadog, New Relic, OpenTelemetry) para detectar fugas de memoria sutiles, picos de saturación de CPU o tasa de errores 5xx por minuto bajo concurrencia.
> - **Impacto:** Debido a esta ausencia de telemetría avanzada, el aprobador no puede predecir cómo se comportará la nueva versión ante picos reales de tráfico de pedidos, dependiendo enteramente de la exhaustividad del Quality Gate del TP5 y de la estabilidad observada en QA.

### 4.3 Evidencia de aprobación y rechazo documentado
Un gate que nunca rechaza no es una compuerta: es un decorado. Por ende, el flujo contempla y documenta ambos caminos:
- **Flujo de rechazo con motivo específico (Evidencia obligatoria):**
  - Ante una corrida donde se detectó una ventana operativa no apta o una inconsistencia funcional en QA, el revisor pulsa *Reject* e ingresa un comentario formal explicando la causa (ej: *«Rechazado: ventana de mantenimiento comercial cerrada; postergar a horario nocturno»*). El run de GitHub Actions queda marcado como `Failed / Rejected` y el job de producción **nunca se ejecuta**, protegiendo el entorno real.
- **Flujo de aprobación exitosa:**
  - Cumplidos los 4 criterios, el revisor autoriza el despliegue con una nota formal (*«Validado en QA y verificado smoke test sin demoras»*), desbloqueando los secretos del environment `production` y disparando el deploy hook a Render.
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

### 5.1 Restricciones de Render y Neon (Presupuesto y cálculo matemático)
El diseño de pipelines y entornos en la nube exige comprender el contrato del proveedor y realizar la aritmética de costos/límites:
- **Render Web Services (Free Tier) — Presupuesto de horas:**
  - Otorga **750 horas de cómputo por mes para todo el workspace**.
  - En OrderFlow mantenemos 4 servicios activos: Backend QA, Frontend QA, Backend PROD y Frontend PROD.
  - **El cálculo matemático de agotamiento:**
    $$\frac{750 \text{ horas/mes}}{4 \text{ servicios}} = 187.5 \text{ horas por servicio al mes}$$
    Si los 4 servicios permanecieran encendidos en forma ininterrumpida ($24 \text{ horas/día}$), el cupo mensual total se consumiría en:
    $$\frac{187.5 \text{ horas}}{24 \text{ h/día}} \approx 7.8 \text{ días}$$
    ¡El workspace se quedaría sin horas antes de terminar la primera semana y media del mes!
  - **Consecuencia de diseño:** El comportamiento de **suspensión por inactividad (sleep tras 15 minutos sin tráfico)** no es una molestia accidental, sino el **mecanismo mandatorio** que permite que los 4 servicios convivan durante todo el semestre académico sin costo alguno.
  - **Cupo de builds:** Otorga **500 minutos de build al mes por workspace**. Dado que cada deploy tarda ~2-3 minutos en compilar el contenedor en Render, el presupuesto tolera alrededor de 150 a 200 despliegues mensuales, requiriendo prudencia en no disparar deploys innecesarios.
- **Neon Serverless PostgreSQL:**
  - Tier gratuito permanente sin vencimiento de 30 días (a diferencia de Render Postgres, que borra la base al día 30).
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

### 6.1 Comparación de estrategias de deployment y elección para OrderFlow

> 🎯 **Estrategia elegida y definitiva para OrderFlow:**
> La estrategia adoptada formalmente para Producción real es **Blue-Green Deployment** complementado a nivel de aplicación con **Feature Flags**.
> - **A nivel infraestructura (Blue-Green):** Garantiza cero downtime y rollback instantáneo sin el riesgo de inconsistencias transaccionales que tendría un Rolling update.
> - **A nivel aplicación (Feature Flags):** Permite desacoplar el deploy del release comercial, prendiendo o apagando funcionalidades sin redeployar.

Para fundamentar esta decisión, se evaluaron los cuatro grandes patrones arquitectónicos de la industria:

1. **Recreate (Recreación):**
   - *Mecanismo:* Se apagan todas las instancias de la versión vieja y luego se inician las instancias de la nueva versión.
   - *Evaluación para OrderFlow:* Inadmisible. Provoca **downtime garantizado** durante varios minutos. Si un usuario está confirmando un pedido o realizando un pago, la transacción se interrumpe abruptamente con un error 502/503.

2. **Rolling Update (Actualización progresiva):**
   - *Mecanismo:* Se reemplazan instancias de a una o en lotes pequeños (ej: 25% a la vez) detrás de un balanceador.
   - *Evaluación para OrderFlow:* Presenta un riesgo crítico de **incompatibilidad transaccional**. Durante el despliegue conviven simultáneamente dos versiones distintas del backend atendiendo clientes. Si la versión nueva introdujo cambios en el cálculo de prioridad de pedidos o en el esquema de base de datos, una petición podría ser atendida por la versión vieja y la siguiente por la nueva, corrompiendo datos o generando estados inconsistentes en la base.

3. **Canary Deployment (Despliegue canario):**
   - *Mecanismo:* Se enruta un porcentaje mínimo de tráfico real (ej: 2% o 5%) a la nueva versión para validar métricas antes de expandirla al 100%.
   - *Evaluación para OrderFlow:* Es la estrategia más segura para plataformas masivas, pero **requiere infraestructura y observabilidad avanzada** (balanceadores de carga con *traffic shaping*, APM en tiempo real, alarmas automatizadas que comparen tasa de errores HTTP 5xx y latencia). Hoy OrderFlow en el free tier no dispone de esa telemetría en caliente para automatizar una compuerta canaria.

4. **Blue-Green Deployment (Nuestra elección arquitectónica para Producción):**
   - *Mecanismo:* Se mantienen dos entornos de producción físicamente idénticos pero aislados: **Blue** (activo, atendiendo el 100% de los usuarios) y **Green** (inactivo / *standby*).
   - *Flujo:* El despliegue se realiza sobre Green sin afectar el servicio. Se ejecutan smoke tests completos contra Green. Una vez validado, el router/balanceador conmuta instantáneamente el 100% del tráfico a Green.
   - *Por qué es ideal para OrderFlow:*
     - **Cero downtime:** La conmutación ocurre a nivel de router en milisegundos.
     - **Aislamiento transaccional:** Nunca conviven versiones dispares atendiendo clientes simultáneamente.
     - **Rollback instantáneo:** Si surge una falla catastrófica post-lanzamiento, volver atrás es tan simple como re-conmutar el router hacia Blue en segundos, minimizando drásticamente el impacto operativo.

5. **Complemento con Feature Flags (Desacoplar Deploy técnico de Release de negocio):**
   - Como se explicó en el §2.3, las Feature Flags permiten desplegar código nuevo en producción manteniéndolo inactivo tras un condicional (`if (featureFlag.isEnabled('NEW_DISCOUNT'))`).
   - Esto permite que el equipo técnico despliegue binarios en cualquier momento y el equipo comercial active la funcionalidad cuando esté lista, eliminando el estrés de sincronizar deploys con campañas de marketing.

### 6.2 Plan de Rollback actual en Render (Paso a paso)
Si un despliegue aprobado en Render introduce un fallo crítico no detectado por el smoke test, el procedimiento formal de rollback es:

1. **Identificar el último commit estable:**
   - Consultar la última release estable o el commit del deploy previo en *Deployments → production* de GitHub (ej: `SHA_ANTERIOR=$(git rev-list -n1 v5.0.0)` o el commit previo al fallo).
2. **Disparar los Deploy Hooks apuntando al SHA anterior:**
   - Desde la terminal o un script seguro, invocar los hooks de producción especificando el commit anterior:
     ```bash
     curl -fsS "$HOOK_API_PROD&ref=$SHA_ANTERIOR"
     curl -fsS "$HOOK_FRONT_PROD&ref=$SHA_ANTERIOR"
     ```
   - Alternativamente, en la interfaz web de Render: ingresar al servicio de producción $\to$ pestaña *Deploys* $\to$ ubicar el deploy del commit anterior y seleccionar **Rollback to this deploy**.
3. **Monitoreo en Render:**
   - Observar el log del servicio hasta que el commit anterior figure con estado **Live**.
4. **Verificación de sanidad:**
   - Ejecutar el smoke test contra la API y el Frontend de Producción para constatar la recuperación del servicio.

### 6.3 Medición empírica del Rollback en Render y Métrica DORA (MTTR)

Conforme a las exigencias del práctico de basar el plan en **números medidos empíricamente y no estimados de memoria**, se ejecutó una prueba real de rollback en la consola de Render:

* **Tiempos reales cronometrados (desde inicio hasta estado *Live*):**
  - **Frontend (`orderflow-front-prod`):** **21.3 segundos**
  - **Backend (`orderflow-api-prod`):** **1 minuto 10 segundos (70 segundos)**

* **Análisis técnico de la diferencia de tiempos:**
  - **Por qué el Frontend tardó 21.3 s:** El frontend es un artefacto estático liviano servido por Nginx. Render únicamente necesita restablecer la imagen del contenedor y reiniciar el servidor web; no hay framework pesado ni conexiones a bases de datos que inicializar.
  - **Por qué el Backend tardó 70 s:** La API en NestJS requiere el ciclo de vida completo de un servidor Node.js: arranque del motor, resolución del árbol de inyección de dependencias, handshake TCP y TLS del pool de Prisma contra Neon PostgreSQL, ejecución de los scripts de bootstrap y respuesta exitosa del endpoint `/health` antes de que el balanceador interno de Render lo marque como operativo.

* **Impacto en la métrica DORA — MTTR (Mean Time to Recovery):**
  - La métrica DORA de **MTTR** evalúa cuánto tiempo le toma a una organización recuperarse de una degradación o fallo catastrófico en producción.
  - Gracias a la trazabilidad de los commits en los deploys de Render, el MTTR de OrderFlow ante un fallo de código es de **70 segundos** (1 minuto 10 s), situándose en la categoría de **alto rendimiento (Elite/High Performer)** según los estándares de la industria (recuperación en menos de 1 hora).

* **Lo que el rollback de código NO deshace (y cómo se resolvería):**
  - El rollback revierte los contenedores y el código de la aplicación, pero **no revierte modificaciones destructivas en los datos de la base de datos**.
  - Si una migración eliminó una columna (`DROP COLUMN`) o alteró tipos de datos en la base de Neon, la versión de código restaurada intentará interactuar con un esquema modificado y fallará.
  - *Solución integral:* El rollback de infraestructura debe complementarse con un **Point-in-Time Restore (PITR) / snapshot** en Neon o la ejecución de una migración inversa controlada (`down migration`).

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
4. **Portabilidad arquitectónica (¿Qué pasa si Render desaparece mañana?):**
   - *Análisis de desacoplamiento:* Casi el **100% de la ingeniería implementada sobrevive sin modificaciones**:
     - Las imágenes y Dockerfiles son OCI estándar y corren en cualquier entorno de contenedores.
     - La plantilla dinámica de Nginx (`default.conf.template`) opera idénticamente en cualquier host.
     - El pipeline de CI/CD en GitHub Actions y los paquetes en `ghcr.io` son completamente agnósticos de la nube de despliegue.
     - La persistencia reside en Neon (PostgreSQL estándar), no en Render.
   - *Lo único que migra:* Solo los dos webhooks HTTP (`curl $HOOK_API`), que serían reemplazados por los hooks o comandos equivalentes del nuevo proveedor (AWS ECS, Google Cloud Run, Fly.io, Railway o un `kubectl rollout` hacia Kubernetes).

---

## 8. Declaración de uso de IA

Se utilizó asistencia de IA como pair programmer para:
- Adaptar la plantilla de configuración de Nginx y el script de smoke test a los endpoints específicos de OrderFlow (`/api/products`).
- Configurar las etapas del pipeline en `.github/workflows/ci.yml` asegurando la sintaxis de GitHub Environments y la inyección de `&ref=$GITHUB_SHA`.
- Estructurar y documentar las decisiones técnicas y de arquitectura en `decisiones.md`.
- Toda la configuración técnica, secrets, bases de datos y despliegues fueron configurados, validados y comprobados en vivo en las consolas de GitHub, Render y Neon.

---

# TP7 — Contenedores en el pipeline + integración y e2e

## Enlaces de este TP

> **Nota:** Conforme al entregable de la cátedra, esta sección reúne todos los accesos externos, paquetes inmutables y evidencias de ejecución requeridas para la corrección y defensa de P2.

| Recurso / Evidencia | Enlace / Identificador | Descripción |
|---|---|---|
| **Paquete Backend (GHCR)** | [ghcr.io/santinoschiavoni/ingsoft3-tp01-backend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) | Imagen pública inmutable de backend en GitHub Container Registry, etiquetada por commit (`:sha-<commit>`). Descargable sin credenciales. |
| **Paquete Frontend (GHCR)** | [ghcr.io/santinoschiavoni/ingsoft3-tp01-frontend](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) | Imagen pública inmutable de frontend en GitHub Container Registry, etiquetada por commit (`:sha-<commit>`). Descargable sin credenciales. |
| **Commit que rompió el front** | [`4689aa3`](https://github.com/SantinoSchiavoni/ingsoft3-tp01/commit/4689aa3f253418cd1c8723fc1110befeb9ce7931) | Commit que introdujo la falla en la suite de frontend (`e2e/pedidos.spec.js`) por navegación prematura, provocando el freno de promoción. |
| **Corrida: Integración VERDE + E2E ROJA** | [Run #47 (38174414216)](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/38174414216) | Corrida de GitHub Actions donde el smoke y la integración (`api.spec.js`) pasaron en verde, pero la suite E2E falló ([Job e2e](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/38174414216/job/114575859253)) frenando la promoción a PROD. |
| **Artefacto Reporte Integración (Verde)** | `playwright-report-integracion` | Reporte HTML generado por Playwright para `e2e/api.spec.js` en la corrida roja de prueba (disponible en Run #47). |
| **Artefacto Reporte E2E (Rojo con traza)** | `playwright-report-e2e` | Reporte HTML con screenshot y traza (`trace.zip`) de la falla capturada en `e2e/pedidos.spec.js` (descargable desde Run #47). |
| **Corrida completa en VERDE** | [Run #49 (38175609853)](https://github.com/SantinoSchiavoni/ingsoft3-tp01/actions/runs/38175609853) · [PR #35](https://github.com/SantinoSchiavoni/ingsoft3-tp01/pull/35) | Corrida posterior al fix ([`d4e3142`](https://github.com/SantinoSchiavoni/ingsoft3-tp01/commit/d4e3142)) con toda la cadena aprobada y desplegada hasta Producción. |
| **QA - Frontend URL** | [https://orderflow-front-qa.onrender.com](https://orderflow-front-qa.onrender.com) | URL pública del entorno QA ejecutando la imagen inmutable de GHCR. |
| **QA - Backend / Health URL** | [https://orderflow-api-qa.onrender.com/health](https://orderflow-api-qa.onrender.com/health) | Endpoint `/health` y `/api/products` de QA conectado a la base `app_qa` de Neon. |
| **PROD - Frontend URL** | [https://orderflow-front-prod.onrender.com](https://orderflow-front-prod.onrender.com) | URL pública del entorno de Producción ejecutando la misma imagen verificada en QA. |
| **PROD - Backend / Health URL** | [https://orderflow-api-prod.onrender.com/health](https://orderflow-api-prod.onrender.com/health) | Endpoint de Producción conectado a la base `app_prod` de Neon. |
| **Release v7.0.0** | *(Pendiente de creación en §3.5)* | Tag y Release oficial de GitHub sobre el commit exacto desplegado en Producción. |

---

## 1. Build once, deploy many: la imagen como unidad de release

### 1.1 El problema del TP6 que resuelve este práctico
En el TP6, la cadena de despliegue promovía **commits** de Git: cada entorno (QA y PROD) recibía la señal del webhook y procedía a clonar el repositorio y **reconstruir la aplicación desde cero**.

Esto rompía el principio fundamental de reproducibilidad:
- **No-determinismo temporal:** El build de QA ocurría a una hora y el de PROD ocurría minutos u horas más tarde (tras la aprobación manual). Durante esa ventana, la resolución de dependencias remotas (parches menores en `npm`, imágenes base actualizadas en Docker Hub) podía generar binarios sutilmente diferentes.
- **Falsa equivalencia:** Lo que llegaba a producción no era bit a bit lo que se había verificado en QA, sino una segunda compilación independiente.

### 1.2 La solución en OrderFlow
Con el TP7, la unidad de release pasa a ser la **imagen de contenedor inmutable**:
1. El pipeline de CI construye las imágenes de backend y frontend **una única vez** en el runner de GitHub Actions.
2. Ambas imágenes son empaquetadas con su runtime, dependencias exactas y código compilado, y se publican en `ghcr.io` bajo la etiqueta `sha-<commit>`.
3. Render pasa a operar en modo *Existing Image*: el proveedor no compila nada; únicamente descarga y ejecuta la imagen indicada.
4. **Promoción real:** Desplegar en QA y luego en PROD consiste en pasarle a cada entorno exactamente el mismo identificador de imagen (`imgURL`). Si un comportamiento fue validado en QA, se garantiza matemáticamente que en PROD correrá idéntico.

---

## 2. Estrategia de etiquetas e inmutabilidad

### 2.1 `sha-<commit>` vs `latest`
- **Por qué usamos `sha-<commit>`:** Cada corrida de CI etiqueta las imágenes con el hash completo de 40 caracteres del commit verificado en `main` (`sha-${{ github.sha }}`). Esto establece una trazabilidad criptográfica directa: mirando la imagen que corre en cualquier entorno se sabe de qué commit exacto provino.
- **Por qué el pipeline NO publica `latest`:** `latest` es un puntero mutable. Si múltiples corridas o merges se ejecutan, `latest` se sobrescribe constantemente. Desplegar `latest` en producción implicaría que nadie puede auditar qué versión exacta está corriendo ni hacer un rollback certero.

### 2.2 Configuración inicial en Render vs imagen que corre
Para convertir los servicios a *Existing Image*, Render exige ingresar una URL de imagen válida como punto de partida. Se utilizó la imagen del primer merge verificado (`sha-c43e1302...`). 

Sin embargo, **no es esa imagen la que corre de forma permanente**:
- Cada ejecución del workflow invoca el deploy hook agregando el parámetro `--data-urlencode "imgURL=..."`.
- Render actualiza el contenedor activo a la imagen provista en el hook sin modificar la configuración estática de *Settings*.
- *Alerta de Manual Deploy:* Si un operador hace clic en *Manual Deploy* desde la interfaz de Render, el servicio volvería erróneamente a la imagen original configurada en *Settings*. Por esta razón, todos los despliegues son estrictamente orquestados por el pipeline.

### 2.3 Preservación de servicios existentes
En lugar de crear 4 servicios nuevos en Render, se editó la fuente (*Source → Existing Image*) de los 4 servicios existentes (api-qa, front-qa, api-prod, front-prod). Esto evitó:
- Cambiar las URLs públicas y desconfigurar DNS.
- Regenerar secrets y deploy hooks en GitHub.
- Duplicar el consumo de horas del plan gratuito (que comparte 750 horas mensuales por workspace).

---

## 3. Trazabilidad: De la Release a la Imagen en un solo paso

En caso de incidente en producción, el catálogo de releases permite identificar la imagen exacta a restaurar de forma inmediata:

1. El tag de git `v7.0.0` apunta al commit específico que está corriendo en producción (obtenido desde GitHub Deployments):
   ```bash
   git rev-list -n1 v7.0.0
   # Devuelve: <SHA-40-CARACTERES>
   ```
2. La imagen asociada en el registry lleva idéntica etiqueta:
   - Backend: `ghcr.io/santinoschiavoni/ingsoft3-tp01-backend:sha-<SHA>`
   - Frontend: `ghcr.io/santinoschiavoni/ingsoft3-tp01-frontend:sha-<SHA>`
3. Restaurar dicha versión consiste únicamente en invocar el deploy hook pasándole ese `imgURL`, sin necesidad de reconstruir código fuente.

---

## 4. Verificación externa y límites del Smoke Test

### 4.1 Comprobación externa de imagen ejecutada
Para constatar que el entorno ejecuta la imagen inmutable y no un build desde el repositorio:
- En la pestaña *Events* de cada servicio de Render se lee:
  `Deploy live for ghcr.io/santinoschiavoni/ingsoft3-tp01-...:sha-<commit>`
  acompañado de la leyenda **«Triggered via Deploy Hook»**.
- Los paquetes en GHCR son públicos y pueden descargarse con `docker pull` sin credenciales desde cualquier máquina.

### 4.2 Lo que el Smoke Test NO puede verificar
El smoke test implementado en el pipeline ejecuta consultas `curl` contra `/health`, `/api/products` y `/`.
- **Qué prueba:** Que el servidor web y la base de datos responden peticiones HTTP con códigos 2xx.
- **Qué NO prueba:**
  1. Si Render falló al descargar la nueva imagen y continuó sirviendo silenciosamente la versión anterior, el smoke test da verde igual.
  2. No prueba la interacción de un usuario real en el navegador.
  3. No detecta desfasajes de integración entre el frontend y la API (ej: un botón que envía un payload con campos renombrados o un proxy mal enrutado).

---

## 5. Diseño de las suites de prueba: La Pirámide de Testing

En consonancia con la pirámide de automatización, cada nivel de prueba tiene una responsabilidad y costo delimitados:

| Nivel | Herramienta | Entorno | Qué prueba | Qué NO prueba | Tiempo |
|---|---|---|---|---|---|
| **Unitarios (TP5)** | Jest / Vitest | Runner (memoria) | Reglas de negocio aisladas con dobles | Comportamiento del driver real y persistencia | Milisegundos |
| **Integración (TP7)** | Playwright (`request`) | QA desplegado | Contrato HTTP de la API contra PostgreSQL real en Neon | Interacción de usuario y renderizado de UI | Segundos (~3 s) |
| **End-to-End (TP7)** | Playwright (Chromium) | QA desplegado | Flujos de usuario completos de punta a punta | Casos de borde exhaustivos de lógica interna | Minutos (~40 s) |

### 5.1 Suite de Integración (`frontend/e2e/api.spec.js`)
Prueba directamente la API desplegada de QA contra su base de datos PostgreSQL real, sin abrir navegadores ni usar dobles de prueba:
1. **Alta + Verificación + Borrado:** Crea un pedido con cliente único (`api ${Date.now()}`), verifica que el `GET /api/orders` lo retorna desde PostgreSQL, ejecuta `DELETE /api/orders/:id` y comprueba que la consulta posterior ya no lo contiene.
2. **Alta inválida:** Envía un payload con nombre de cliente vacío; la API responde `400` y se comprueba que la base de datos no incrementó su cantidad de registros.
3. **Transición de estado y ciclo de vida (Tercera prueba a elección):** Crea un pedido en estado `PENDING`, ejecuta `POST /api/orders/:id/confirm` y verifica en la base de verdad que el estado transitó a `CONFIRMED`.
   - *¿Por qué esta prueba?:* La confirmación de pedidos es el evento de dominio neurálgico en OrderFlow donde se descuenta stock transaccionalmente y se congelan los precios. 
   - *¿Quién te escribe si se rompe?:* El **jefe de depósito / logística**, porque los pedidos quedan trabados en `PENDING`, impidiendo descontar mercadería y despachar entregas.

### 5.2 Suite End-to-End (`frontend/e2e/pedidos.spec.js`)
Ejercita la aplicación completa mediante un navegador Chromium real contra la URL pública de QA:
1. **Creación y borrado completo:** Navega a `/orders/new`, completa el formulario con cliente único (`e2e ${Date.now()}`), agrega un producto, envía el formulario, comprueba que el pedido figura en la tabla de `/orders` y lo elimina mediante el botón accesible `Borrar <cliente>`, comprobando su desaparición.
2. **Validación de error en formulario:** Ingresa un nombre con un único caracter (`'a'`), comprueba que el elemento con `role="alert"` se torna visible y que el botón `Crear Pedido` permanece bloqueado (`disabled`).
3. **Búsqueda de cliente en tiempo real (Tercera prueba a elección — El flujo de todos los días):** Crea un pedido real, ingresa al listado `/orders`, utiliza el campo accesible `Buscar Cliente` para filtrar por ese nombre (disparando una consulta HTTP real con filtro en PostgreSQL), verifica que el pedido aparece de inmediato en la tabla, y luego borra el registro comprobando su eliminación.
   - *¿Por qué esta prueba?:* Es el flujo de mostrador que los vendedores y cajeros realizan **decenas de veces por día**: cuando un cliente llega a retirar o consultar un pedido, el operador escribe su nombre en el buscador para localizarlo en segundos. Toca la UI, el proxy de Nginx, la API con query params y la cláusula `ILIKE / contains` de PostgreSQL.
   - *¿Quién te escribe si se rompe?:* El **equipo de ventas y atención al cliente en mostrador**, porque no pueden atender al público ni ubicar los pedidos en cola, provocando demoras y quejas inmediatas.

### 5.3 Qué NO se puso en cada suite y por qué (Criterio de la Pirámide)
- **Lo que NO pusimos en E2E:** No se pusieron validaciones matemáticas exhaustivas de redondeo de centavos, combinaciones complejas de stock negativo o cálculos de recargos. Hacer eso en E2E requeriría decenas de navegadores y minutos de ejecución innecesarios; esas reglas están exhaustivamente cubiertas por los 19 unit tests de Vitest y 20 de Jest en milisegundos.
- **Lo que NO pusimos en Integración:** No se montaron pantallas, emulaciones de eventos DOM ni verificación de estilos CSS; la integración verifica exclusivamente el contrato HTTP y la persistencia de datos contra la base real.

### 5.4 Ejecución de las suites y visualización del reporte en local

Para reproducir localmente la ejecución de las suites contra la infraestructura levantada en `docker compose`:

```bash
cd frontend

# Ejecutar las dos suites juntas (los 6 tests: API + Navegador):
API_BASE_URL=http://localhost:3000 E2E_BASE_URL=http://localhost:41777 npx playwright test

# Ejecutar cada suite por separado:
API_BASE_URL=http://localhost:3000 npx playwright test e2e/api.spec.js        # Integración (sin browser)
E2E_BASE_URL=http://localhost:41777 npx playwright test e2e/pedidos.spec.js   # E2E (Chromium real)

# Abrir el reporte visual HTML interactivo de la última corrida:
npx playwright show-report
```

> **Nota sobre el reporte HTML:** Playwright genera su reporte sobre la última ejecución realizada. Al correr el comando combinado con ambas variables, el reporte despliega los 6 tests en verde (`All 6 Passed`). En el pipeline de CI (§3.4), cada suite se ejecuta en un job independiente para subir dos reportes separados (`playwright-report-integracion` y `playwright-report-e2e`).

---

## 6. Diagnóstico del par Verde / Rojo

La coexistencia de las dos suites en QA permite transformar una alarma en un **diagnóstico certero** sin necesidad de inspeccionar el código:

| Integración | E2E | Diagnóstico técnico |
|:---:|:---:|---|
| 🟢 | 🔴 | **Fallo en Frontend:** La API y la base de datos están completamente sanas. La rotura reside en el cliente web (un botón inaccesible, un selector de UI cambiado o un campo mal nombrado en el formulario). |
| 🔴 | ⬜ *(Salteado)* | **Fallo en Backend o BD:** La API rechazó la petición o la base falló. Por diseño del pipeline (`needs: integracion`), el job de E2E ni siquiera llega a ejecutarse, ahorrando minutos de cómputo en runners. |
| 🟢 | 🟢 | **Cadena sana:** Tanto los contratos de datos como la experiencia de usuario funcionan correctamente. |

---

## 7. Integración amplia vs Integración estrecha

- **Enfoque adoptado (Integración Amplia):** Se ejecutan las pruebas contra la API de QA ya desplegada, interactuando con su instancia real de Neon PostgreSQL.
  - *Ventajas:* Prueba el entorno real, las variables de entorno inyectadas, el driver de PostgreSQL en producción y las migraciones de Prisma sin requerir levantar servicios auxiliares en el runner.
  - *Desventajas:* Requiere que QA esté desplegado y despierto previamente (dependencia del smoke test).
- **Alternativa (Integración Estrecha):** Levantar la aplicación en memoria en el runner con un contenedor de PostgreSQL efímero como `services:` del job de CI.
  - *Ventajas:* Ejecución más temprana sin esperar al deploy.
  - *Desventajas:* Mayor complejidad de configuración y no valida que la imagen empaquetada funcione en el proveedor cloud.

---

## 8. Cold start del Free Tier y mitigación de tests flaky

### 8.1 Manejo de latencia en Render
Los servicios de Render en plan gratuito se suspenden tras 15 minutos de inactividad (cold start). Para evitar falsos negativos en las pruebas:
1. El step de `smoke-test` en `deploy-qa` realiza sondeos continuos (`curl`) durante un máximo de 10 minutos, despertando la API y el Frontend antes de que arranquen las suites de Playwright.
2. En `playwright.config.js` se fijaron timeouts tolerantes:
   - Timeout por test: **60 segundos**.
   - Timeout por aserción (`expect`): **15 segundos**.
   - Reintentos: **1 retry** (`retries: 1`) para absorber eventuales demoras de red transitorias.

### 8.2 ¿Qué es un test flaky y cómo se evitó?
Un **test flaky** es aquel que, sin cambios en el código bajo prueba, a veces pasa y a veces falla de manera intermitente. Es perjudicial porque destruye la confianza del equipo en la integración continua.
- **Mitigación estricta:** Se eliminó por completo el uso de esperas fijas arbitrarias (`sleep()`, `setTimeout()`). 
- Toda sincronización se realiza mediante el **auto-waiting** nativo de Playwright y web-first assertions (`toBeVisible()`, `toHaveCount(0)`), las cuales esperan reactivamente a que el DOM alcance el estado deseado.

---

## 9. Desacoplamiento del Frontend: Misma imagen para QA y PROD

La imagen de frontend generada en GHCR es idéntica en QA y en Producción:
- **Sin URLs hardcodeadas:** No se inyectaron variables de Vite durante el build (`VITE_API_URL` queda vacío).
- **Proxy reverso dinámico:** El contenedor ejecuta Nginx utilizando `/etc/nginx/templates/default.conf.template`. Al iniciar el contenedor en Render, Nginx interpola la variable `BACKEND_URL` correspondiente a cada entorno y redirige todas las peticiones `/api/*` al backend de su ambiente respectivo.

---

## 10. Límites conocidos de la cadena

- **Entorno QA único compartido:** Al existir un único ambiente de QA, si dos desarrolladores mergean a `main` con poca diferencia de tiempo, una corrida podría redesplegar QA mientras la suite de la corrida anterior se encuentra ejecutando.
- **Regla operacional:** Respetar un merge a la vez esperando la finalización de los jobs `integracion` y `e2e`.
- **Solución enterprise:** En entornos corporativos, esta limitación se resuelve mediante **Ephemeral / Preview Environments** creados por Pull Request que nacen y mueren con cada corrida.

---

## 11. Problemas encontrados y soluciones

1. **Colisión de Vitest con specs de Playwright:**
   - *Problema:* Vitest ejecutaba por defecto los archivos `*.spec.js` ubicados en `e2e/`, arrojando errores de contexto asíncrono al encontrar funciones de Playwright.
   - *Solución:* Se agregó `exclude: [...configDefaults.exclude, 'e2e/**']` en `frontend/vite.config.ts`.
2. **Ausencia de endpoint de eliminación para limpieza:**
   - *Problema:* Para cumplir con la regla de limpieza estricta de datos generados en las pruebas, la entidad `Order` carecía de un endpoint DELETE en el backend.
   - *Solución:* Se implementó `DeleteOrderUseCase`, el método en `PrismaOrderRepository` con borrado en cascada de items, y el endpoint `@Delete(':id')` en `OrdersController` con código HTTP 204.
3. **Falta de selectores accesibles en los componentes:**
   - *Problema:* Los inputs y botones del frontend carecían de etiquetas semánticas y `aria-label`, lo que obligaba a usar selectores CSS frágiles.
   - *Solución:* Se incorporaron atributos `htmlFor`, `aria-label` y `role="alert"` en `CreateOrderPage.tsx` y `OrdersListPage.tsx`, mejorando la accesibilidad web real del sistema.

---

## 12. Declaración de uso de IA

Se utilizó asistencia de IA como pair programmer para:
- Estructurar las suites de prueba en Playwright (`api.spec.js` y `pedidos.spec.js`) asegurando la ausencia de `sleep` y el uso exclusivo de selectores accesibles.
- Diseñar e implementar el caso de uso `DeleteOrderUseCase` y su integración en la arquitectura hexagonal del backend con sus pruebas unitarias.
- Documentar las justificaciones arquitectónicas, análisis de métricas y respuestas conceptuales en `decisiones.md`.
- Toda la configuración técnica, ejecución de pruebas locales y remotas, y resolución de dependencias fueron verificadas empíricamente.

