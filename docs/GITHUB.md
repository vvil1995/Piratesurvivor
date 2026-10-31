# GitHub privado y Codex

El proyecto está inicializado como repositorio Git local en la rama main. La conexión disponible con GitHub no tenía autenticación válida al preparar el prototipo; no se creó ningún repositorio remoto ni se subió código. No compartas tokens en el chat.

## Conectar tu cuenta

Si trabajas desde el ZIP de código fuente, ese archivo no contiene el directorio `.git`. Inicializa su historial antes de conectar el remoto:

```bash
git init -b main
git add .
git commit -m "Prototipo jugable 0.3"
git tag v0.3.0
```

En el workspace original esos pasos ya están hechos; no los repitas allí.

Con una sesión de GitHub válida en tu ordenador o con el conector de GitHub habilitado en Codex:

```bash
gh auth login
gh repo create one-piece-survivor --private --source=. --remote=origin --push
git push origin --tags
```

Ejecuta estos comandos desde la carpeta del proyecto. `--private` es obligatorio. El repositorio usa tu cuenta activa; si necesitas una organización, especifica `organizacion/one-piece-survivor` y revisa sus permisos.

Si ya creaste un repositorio privado vacío, añade su URL como origin en lugar de crear otro:

```bash
git remote add origin https://github.com/TU_USUARIO/one-piece-survivor.git
git push -u origin main
git push origin --tags
```

## Trabajar con Codex

1. Conecta GitHub en Codex y concede acceso únicamente al repositorio privado.
2. Selecciona ese repositorio para las tareas o abre su checkout local en Codex.
3. Configura el entorno con Node.js 22.18+ y `npm ci`.
4. Codex leerá AGENTS.md. Pide cambios pequeños con criterio de aceptación.
5. Revisa el diff y las comprobaciones antes de integrar una rama.

No se necesita un token guardado en el código, `.env` o configuración del juego. El proyecto no contiene credenciales. Si el entorno de Codex no tiene red, usa un entorno previamente preparado con las dependencias instaladas.

## Comprobaciones y versiones

El workflow `.github/workflows/ci.yml` ejecuta comprobación de tipos, pruebas, licencias y compilación, y adjunta un artefacto descargable con el juego. El artefacto sigue el acceso del repositorio privado; no activa Pages ni publica una release.

Para generar una versión local: `npm run release`. Después de revisar, crea una etiqueta nueva con Git. No vuelvas a usar una etiqueta existente para contenido diferente.

Los workflows usan permisos mínimos de lectura. GitHub Actions puede tener límites o costes según el plan; la ejecución del juego es totalmente estática y no depende de Actions. Si el plan de GitHub no permite Pages privado, conserva los ZIP o utiliza alojamiento privado; no cambies la visibilidad del código.

## Estado actual y Netlify

El remoto privado está en https://github.com/vvil1995/Piratesurvivor, rama `main`. El código ya se ha subido; los avisos anteriores sobre ausencia de remoto describen el estado inicial. No es necesario hacer público el repositorio para usar la integración autorizada de Netlify.

`netlify.toml` establece Node 22.18.0, `npm run build` y carpeta de publicación `dist`. Netlify despliega después de un push si tiene los despliegues automáticos activos para `main`. Los cambios locales no aparecen mientras se editan. Si los despliegues están pausados, usar «Trigger deploy» y revisar el SHA del despliegue publicado.

## GitHub Pages

La configuración de publicación automática y la activación manual están documentadas en [GITHUB_PAGES.md](GITHUB_PAGES.md). El repositorio sigue privado; no cambiar su visibilidad sin autorización expresa. Netlify se conserva.
