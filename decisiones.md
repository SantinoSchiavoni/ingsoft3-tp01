### 1. Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.

Git no pudo resolver el conflicto por si solo ya que primero subimos los cambios desde la rama 'feature/titulo-a' y modificamos la linea 1 del readme, subimos los cambios a 'main', y no sucede nada porque fue el primer cambio en agregarse. Luego cuando quisimos subir los cambios desde la rama 'feature/titulo-b', la misma estaba desactualizada con la rama 'main' y encima ambas ramas modificaron la misma linea de codigo, entonces desde el editor tuvimos q resolver el conflicto(tambien se puede hacer desde terminal y en nuestro editor de codigo, haciendo git pull origin main en la rama y solucionando conflicto)
Para que nunca apareciera el conflicto, ambas ramas no deberian modificar la misma linea de codigo, entonces por mas que este desactualizada, no hay conflicto entre los 2 cambios

### 2. Qué problemas encontraste y cómo los solucionaste. Los tropiezos bien contados valen más que un camino perfecto: son los que demuestran que entendiste.

El mayor problema que encontre fue el siguiente, como yo tengo 2 cuentas operativas de github (mia personal UCC y cuenta que me brindo la empresa donde trabajo) se me genero un conflicto de cual estaba configurada globalmente, entonces cuando quise subir los primeros cambios no me permitia porque tenia la otra cuenta(trabajo).
Yo para clonar el repo y acceder vengo utilizando ssh, entonces le pregunte a chatgpt como solucionar eso, porque no me acordaba como hacer para cambiar de clave. Dejo a continuacion los comandos que corri para solucionar el conflicto

```bash
ls -la ~/.ssh
ssh -T -i ~/.ssh/{clave} -o IdentitiesOnly=yes git@github.com
git remote set-url origin git@github-ucc:SantinoSchiavoni/ingsoft3-tp01.git
git remote -v
ssh -T git@github-ucc
```

### 3. Declaración de uso de IA: qué partes hiciste con ayuda de inteligencia artificial y cómo verificaste lo que te devolvió (§ Uso de IA del enunciado).

Como mencione arriba, use IA para solucionar ese conflicto, no para resolver el ejercicio, ya que sabia como manejar PR y conflictos.