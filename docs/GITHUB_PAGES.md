# Publicación automática en GitHub Pages

Repositorio: `vvil1995/Piratesurvivor`. URL prevista: https://vvil1995.github.io/Piratesurvivor/ (no se considera activa hasta completar la configuración).

## Activación manual

1. En GitHub abrir el repositorio → Settings → Pages.
2. En Build and deployment → Source seleccionar **GitHub Actions**. No elegir una carpeta o rama `gh-pages`.
3. En Settings → Actions → General permitir las acciones oficiales utilizadas si la organización las restringe. El workflow declara sus propios permisos mínimos; no necesita tokens personales ni secretos nuevos.
4. Abrir Actions → **GitHub Pages** → Run workflow → `main`. El primer intento anterior a activar Pages puede fallar en Configure Pages: repetirlo después de la activación.
5. Esperar el trabajo deploy y abrir la URL mostrada en el environment `github-pages`. Cada push posterior a main vuelve a compilar, comprobar y publicar dist automáticamente.

En la comprobación final, GitHub ya informa que el repositorio es público; esta tarea no ha modificado su visibilidad. GitHub Free permite Pages para repositorios públicos; para mantener un repositorio privado se necesita un plan compatible (Pro/Team/Enterprise). Si la opción Pages no está disponible, mantener Netlify mientras se decide entre un plan compatible o autorizar expresamente el cambio a público. No se cambia visibilidad automáticamente. Un repositorio privado no implica que el sitio de Pages tenga acceso privado: revisar su configuración de acceso antes de activarlo.

## Configuración

- `vite.config.ts`: base relativa por defecto para Netlify y desarrollo; `PAGES_BASE_PATH` la sustituye en Pages.
- `.github/workflows/pages.yml`: escucha main y ejecución manual. Instala con npm ci, verifica tipos/pruebas/licencias, compila con `/${{ github.event.repository.name }}/`, comprueba el juego bajo ese subdirectorio y publica únicamente dist con las acciones oficiales.
- El job deploy utiliza pages:write e id-token:write mediante el token efímero de Actions. No hay credenciales en Vite ni variables VITE con secretos.
- `netlify.toml` se conserva intacto. Netlify puede seguir desplegando mientras se activa Pages; no se han eliminado archivos del juego.
- No hay router con rutas profundas ni archivos de audio actualmente. Los atlas importados de forma diferida y los recursos embebidos se comprueban en la compilación servida bajo el subdirectorio real.

## Verificación local

```bash
PAGES_BASE_PATH=/Piratesurvivor/ npm run build
CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/check-pages.mjs
```

El script sirve exclusivamente `/Piratesurvivor/`; un recurso que use incorrectamente `/assets/` recibe404. Prueba escritorio y móvil horizontal, selección de los cinco personajes, inicio/pausa, ausencia de errores404/JavaScript y ausencia del hook QA en producción. En GitHub Actions no es necesario indicar CHROMIUM_EXECUTABLE.

## Progreso guardado

El guardado es local al origen del navegador: el progreso de Netlify no aparece automáticamente en github.io. Antes de cambiar, exportar la partida/progreso desde Netlify e importar el archivo desde Pages con los controles existentes.

## Revisión previa a publicar el repositorio

Revisión realizada:690 versiones históricas de archivos de texto (todos los objetos históricos recuperados/verificados), sin coincidencias de patrones de claves privadas, tokens GitHub, AWS, Google ni claves tipo sk. No hay archivos .env o credenciales versionados. La compilación no expone el hook QA y el artefacto de Pages solo contiene dist, no el archivo ZIP de código fuente. Revisar otra vez los commits posteriores antes de cualquier cambio de visibilidad: una búsqueda por patrones no garantiza la ausencia de todos los formatos posibles de secretos.

Fuentes oficiales:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
