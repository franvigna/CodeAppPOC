# Primeros pasos

## Lo que construimos, paso a paso

1. **Verificamos las herramientas base** Chequeamos que tuvieras Node.js (tenías la v22.15.0, justo la que piden las Code Apps), npm y pac. Node y npm ya los tenías de tu época SPFx. El único que faltaba era el PAC CLI.

2. **Instalamos el PAC CLI** Después de que fallaran las vías de npm (nombre inexistente) y dotnet (config rota de NuGet), lo instalamos con el instalador MSI de Windows desde aka.ms/PowerAppsCLI. Quedó la versión 2.11.2. El PAC CLI es la pieza nueva respecto a SPFx: es el "pegamento" que conecta tu máquina con Power Platform.

3. **Creamos el proyecto desde el template oficial** Con `npx degit github:microsoft/PowerAppsCodeApps/templates/vite` bajamos el esqueleto Vite + React + TypeScript ya configurado, con el SDK correcto de Microsoft adentro (evitando el paquete comprometido del video original). Después `npm install` para bajar las dependencias.

4. **Autenticamos tu máquina con Power Platform** Con `pac auth create` conectaste tu compu a tu cuenta mpessinc@circostudio.com. Esto le dice al PAC CLI quién sos y a qué entornos tenés acceso.

5. **Seleccionamos el entorno correcto** Con `pac env list` viste tus tres entornos, y elegimos tu entorno personal ("Entorno de Milagros Pessino") para practicar sin tocar producción.

   cambiar de entorno: `pac env select --environment numero de entorno`

   ```
   pac env select --environment 6fc3f94c-ba56-e54d-87e4-785e6cded4e2
   ```

6. **Habilitamos Code Apps en el entorno** En el Power Platform Admin Center activaste el toggle **"Habilitar aplicaciones de código"**. Sin esto, los comandos `pac code` fallan. Es un requisito del lado del entorno, no del código.

7. **Registramos el proyecto como Code App** Con `pac code init --displayName "Mi Primera Code App"` se creó el archivo **power.config.json**, que vincula tu carpeta local con tu entorno en la nube.

8. **Corrimos la app en local** Con `npm run dev` Vite levantó el servidor, y abriendo la **"Local Play URL"** (no la localhost pelada) viste tu app React corriendo dentro del runtime de Power Platform. Después probaste el HMR editando App.tsx.

## El mapa mental para retener

Si tuvieras que recordar solo lo esencial, es esto: hay **tres capas** que tuviste que dejar listas.

La **máquina** (Node, npm, PAC CLI instalados), el **proyecto** (template + `npm install` + `power.config.json`), y el **entorno en la nube** (autenticado, seleccionado, con Code Apps habilitado). Las tres tienen que estar alineadas para que funcione. Cuando algo falla en Code Apps, casi siempre es porque una de esas tres capas no está bien: o falta una herramienta, o el proyecto no está inicializado, o el entorno no tiene el permiso.

Y el ciclo de trabajo diario, una vez que todo está armado, se reduce a: **npm run dev → editás → guardás → ves el cambio**. Eso es lo que vas a repetir todo el tiempo. Todo lo demás (pasos 1 a 7) fue setup de una sola vez.

Un detalle honesto: los pasos 1, 2, 6 y 7 los hacés **una sola vez**. Si mañana querés arrancar una segunda Code App, solo repetís el 3 (crear proyecto), 7 (`pac code init`) y 8 (`npm run dev`) — el resto ya queda instalado y configurado.

---

# Conexión de datos

## Dataverse

**Dataverse** es simple: solo necesitás el *nombre lógico* de la tabla. Un comando corto y listo.

```
pac code add-data-source -a dataverse -t cra58_tarea
```

Desglose de qué hace cada parte:

- **-a dataverse** → le decís que el proveedor de datos es Dataverse (`-a` = apiId).
- **-t cra58_tarea** → el nombre lógico de la tabla (`-t` = table).

Esto genera una carpeta con subcarpetas y archivos de modelos y servicios.

Importarlo en app.tsx y usar normalmente react typescript.

## SharePoint

### Requisitos previos

Antes de conectar, asegurate de tener: el proyecto Code App ya inicializado (`pac code init` hecho), una conexión de SharePoint activa en tu entorno (verificable en make.powerapps.com/connections con el selector en tu entorno), y estar autenticada y apuntando al entorno correcto (`pac auth create` + `pac env select`).

### Paso 1: Juntar las 4 piezas del comando

El comando final necesita cuatro datos:

**API ID** → siempre es `shared_sharepointonline` para SharePoint.

**Connection ID** → corré `pac connection list` y copiá el ID **completo** de la conexión de SharePoint. Ojo acá: el ID lleva el prefijo entero (`shared-sharepointonl-43f5ec47-...`), no solo la parte del GUID final. Este fue nuestro primer error.

**GUID de la lista** → en SharePoint, andá a la lista → ⚙️ → Configuración de la lista. En la URL vas a ver `List=%7B<GUID>%7D`. El GUID es lo que está entre `%7B` y `%7D` (que son las llaves `{ }` codificadas). Copialo sin las llaves.

**URL del sitio con doble encoding** → tu sitio `https://circo.sharepoint.com/sites/CircoStudia` hay que codificarlo **dos veces**. No lo hagas a mano. El resultado es: `https%253A%252F%252Fcirco.sharepoint.com%252Fsites%252FCircoStudia`. El doble encoding es por qué ves `%253A` (que es `%3A` re-codificado) en vez de `%3A`.

### Paso 2: Correr el comando

```
pac code add-data-source -a "shared_sharepointonline" -c "<connection-id-completo>" -t "<guid-lista>" -d "<url-doble-codificada>"
```

Si sale bien, genera el modelo y el servicio en `src/generated/` (interfaces tipadas con todas tus columnas y métodos CRUD).

### Paso 3: Reiniciar el servidor de desarrollo

Después de agregar la fuente, **frená y reiniciá** `npm run dev` (Ctrl+C → `npm run dev`). El runtime carga el registro de fuentes al arrancar; si no reiniciás, sigue usando el viejo. Abrí la **Local Play URL fresca** que te dé (no una cacheada).

### Paso 4: Consumir la fuente en el código

```typescript
import { LISTADODEWIKISService } from './generated/services/LISTADODEWIKISService';
import type { LISTADODEWIKISRead } from './generated/models/LISTADODEWIKISModel';

const resultado = await LISTADODEWIKISService.getAll();
if (resultado.success) {
  setWikis(resultado.data);
}
```

Un detalle de SharePoint: los campos choice vienen como objetos, no como números (a diferencia de Dataverse). Para mostrar el texto accedés a `.Value`: `wiki.Estado?.Value`. Las personas también son objetos: `wiki.GeneradaPor?.DisplayName`.

### Los dos problemas que resolvimos

**Error 1 — HTTP 404 al correr `add-data-source`.**
Causa: le pasamos el Connection ID incompleto (solo el GUID final, sin el prefijo `shared-sharepointonl-`). Solución: usar el ID completo tal como aparece en `pac connection list`.

**Error 2 — "Connection reference not found: listado de wikis" al hacer `getAll()`.**
La app cargaba pero no mostraba las wikis. Causa: la fuente quedó registrada en `dataSourcesInfo` pero con la connection reference a medias — el enganche entre la fuente y la conexión no se cerró bien la primera vez. Solución:

```
pac code delete-data-source -a "shared_sharepointonline" -ds "listado de wikis"
```

y volver a agregarla con el comando del Paso 2, **reiniciando el dev server después**. Ese reinicio fue clave para que el runtime tomara el registro corregido.

---

# Caso real: conexión a "Listado de Wikis" (Circo Studio)

## Datos usados

- **Sitio**: `https://circo.sharepoint.com/sites/CircoStudia`
- **Lista**: Listado de Wikis
- **GUID de la lista**: `e8a34448-08a5-4183-9296-2119989a1231` (sacado de la URL `listedit.aspx?List=%7B...%7D`, sin las llaves)
- **URL doble-encoded**: `https%253A%252F%252Fcirco.sharepoint.com%252Fsites%252FCircoStudia`

## Detalle importante: el Connection ID NO llevó prefijo

La guía original advertía que el Connection ID debía llevar el prefijo completo (`shared-sharepointonl-<guid>`). En este caso real, **el prefijo agregado a mano rompió el comando** (dio 404). El ID que devolvió `pac connection list` funcionó **tal cual, sin agregarle nada**:

```
pac connection list
```

Devolvió:

```
Id                               Name                       API Id                                                      Status
c9011182426f4ac6890819c0565da14c fvignardel@circostudio.com /providers/Microsoft.PowerApps/apis/shared_sharepointonline Connected
```

Comando que funcionó (con el ID puro, sin prefijo):

```
pac code add-data-source -a "shared_sharepointonline" -c "c9011182426f4ac6890819c0565da14c" -t "e8a34448-08a5-4183-9296-2119989a1231" -d "https%253A%252F%252Fcirco.sharepoint.com%252Fsites%252FCircoStudia"
```

**Conclusión**: no asumir el prefijo por la guía. Probar primero con el ID exacto que devuelve `pac connection list`; si da 404, recién ahí probar variantes con prefijo.

## Bloqueo pendiente: `pac code push` da 403 `CodeAppOperationNotAllowedInEnvironment`

Después de agregar la fuente de datos, la app corría en modo local (Local Play URL) pero el `getAll()` fallaba con:

```
GET .../powerapps/apps/local/permissions?... 403 (Forbidden)
```

Esto pasa porque `power.config.json` tiene `"appId": null` — la app nunca fue registrada formalmente en el entorno. Para resolverlo hay que correr:

```
npm run build
pac code push
```

Pero `pac code push` devuelve:

```
HTTP error status: 403 for POST .../powerapps/apps?api-version=1:
{"error":{"code":"CodeAppOperationNotAllowedInEnvironment","message":"The environment '<id>' in tenant '<tenant-id>' does not allow this operation for this Code app '<app-id>'. Please reach out to your environment admin to enable Code app operations."}}
```

### Lo que ya se descartó

- El toggle **"Power Apps Code Apps" → "Enable code apps"** en Admin Center → Environments → *Francisco Vignardel's Environment* → Settings → Features **ya está en On**. El error persiste igual, incluso esperando varios minutos para propagación.
- El entorno usado (`Francisco Vignardel's Environment`, tipo **Developer**) es el único donde `pac admin list` muestra permisos de administrador. Los otros dos entornos "Circo Studio" no aparecen ahí.
- El entorno **"Circo Studio" (Default)** es el entorno por defecto del tenant — ahí **no hay permisos de administrador** ni acceso a Settings (confirmado: "Circo Studio" en make.powerapps.com solo ofrece "See details", no acceso a configuración de admin).

### Hipótesis pendiente de confirmar

El bloqueo probablemente sea una restricción a **nivel tenant** (Circo Studio) sobre la feature Code Apps (todavía en Preview), que anula el toggle habilitado a nivel de entorno individual. Requiere que un administrador del tenant (Global Admin o Power Platform Admin, no solo Environment Admin) revise la configuración a nivel organización.

**Pregunta concreta para el admin del tenant**: *"¿Está habilitada la feature 'Power Apps Code Apps' a nivel tenant? Mi entorno Developer tiene el toggle en On pero `pac code push` da 403 CodeAppOperationNotAllowedInEnvironment."*

### Prueba de aislamiento: mismo error en dos entornos distintos

Para descartar que el bloqueo fuera específico del entorno personal (Developer), se repitió todo el setup en el entorno **"Circo Studio" (Default, `7fa88d8c-b752-45ac-9ddb-6fac354f6545`)**:

1. Backup del `power.config.json` original: `copy power.config.json power.config.francisco.json`
2. `pac env select --environment 7fa88d8c-b752-45ac-9ddb-6fac354f6545`
3. `Remove-Item power.config.json` (hace falta borrar el existente, `pac code init` no sobreescribe)
4. `pac code init --displayName "CodeAppPOC" --environment 7fa88d8c-b752-45ac-9ddb-6fac354f6545`
5. `pac connection list` → este entorno ya tenía una conexión SharePoint propia (`86c7370c0ce7445bb6c8c9916f086112`), distinta a la del entorno personal.
6. `pac code add-data-source` con ese Connection ID → salió bien.
7. `npm run dev` → Local Play URL con `Default-7fa88d8c-b752-45ac-9ddb-6fac354f6545` en la ruta.

**Resultado: el mismo 403 en `/local/permissions`.** Esto confirma que el bloqueo **no es específico de un entorno** — ocurre igual en el entorno Developer personal y en el Default de Circo Studio. Es una restricción a **nivel tenant**.

Después de la prueba, se restauró `power.config.json` al entorno personal (`cp power.config.francisco.json power.config.json`).

### Prueba de aislamiento: Dataverse funcionó primero

Para descartar que el 403 fuera del entorno/tenant en general, se creó una tabla nueva en Dataverse (`cr1e4_prueba`, vía Power Apps → Tables → Start from blank + Copilot) en el mismo entorno personal y se conectó:

```
pac code add-data-source -a dataverse -t cr1e4_prueba
```

Cargó sin problema, sin 403. Esto confirmó que el bloqueo era específico del conector SharePoint (o de cómo había quedado registrada esa fuente puntual), no del entorno en general.

### Causa raíz real y solución: el nombre del data source con espacios

El error 403 en `/local/permissions` **no era un bloqueo de tenant ni de política DLP** (esa fue una hipótesis descartada). La causa real: la fuente de SharePoint había quedado registrada originalmente como **`"listado de wikis"`** (con espacios, el *displayName*), en vez de **`"listadodewikis"`** (el `dataSourceName` real usado internamente en `dataSourcesInfo.ts`).

**Solución que funcionó:**

```
pac code delete-data-source -a "shared_sharepointonline" -ds "listadodewikis"
```

(nota: sin espacios, a diferencia de como lo escribe la guía original con `-ds "listado de wikis"`)

Y volver a agregarla con el mismo comando de siempre:

```
pac code add-data-source -a "shared_sharepointonline" -c "c9011182426f4ac6890819c0565da14c" -t "e8a34448-08a5-4183-9296-2119989a1231" -d "https%253A%252F%252Fcirco.sharepoint.com%252Fsites%252FCircoStudia"
```

Reiniciando `npm run dev` después. **Resultado: el listado de wikis cargó correctamente**, con todos los registros y columnas (Título, Estado, Tipo, Generada por).

**Lección clave**: si `pac code delete-data-source -ds "<nombre con espacios>"` no tira error pero tampoco soluciona el problema, probar con el nombre **sin espacios** tal como aparece la clave real en `.power/schemas/appschemas/dataSourcesInfo.ts` (ej. `listadodewikis`, no `listado de wikis`). El comando puede "aceptar" el nombre con espacios sin fallar pero no matchear la entrada real a borrar, dejando el registro corrupto/duplicado que causaba el 403 de permisos.

### Estado final

- **Dataverse** (`cr1e4_prueba`): funciona.
- **SharePoint** (`listadodewikis` / Listado de Wikis): funciona, tras borrar y re-agregar la fuente usando el nombre correcto (sin espacios).
- `App.tsx` muestra ambas fuentes en la misma pantalla.
