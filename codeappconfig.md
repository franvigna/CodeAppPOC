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
