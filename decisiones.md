# Índice

1. [TP1 - Git Colaborativo](#tp1---git-colaborativo)
2. [TP2 — Selección de aplicación: OrderFlow](#tp2--selección-de-aplicación-orderflow)
3. [TP3 - Planificacion DevOps](#tp3---planificacion-devops)
4. [TP4 — CI: Pipelines as Code](#tp4--ci-pipelines-as-code)
5. [TP5 — Calidad automatizada: tests, coverage y el umbral que frena un merge](#tp5--calidad-automatizada-tests-coverage-y-el-umbral-que-frena-un-merge)

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



