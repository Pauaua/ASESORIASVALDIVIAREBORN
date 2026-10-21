# Despliegue: Vercel + Neon + dominio

Guía para poner en producción el sitio nuevo. El proyecto antiguo de Vercel ya no existe, así que
el dominio se conecta directamente al proyecto nuevo.

Orden recomendado:

1. Proyecto de Vercel
2. Base de datos Neon conectada al proyecto (y migración de datos) →
   [`migracion-bd.md`](migracion-bd.md)
3. Variables de entorno
4. Deploy de preview y prueba de humo
5. Dominio
6. PC del daemon apuntando al proyecto nuevo
7. Verificación final

## 1. Proyecto de Vercel

1. Vercel → **Add New → Project** → importa `Pauaua/ASESORIASVALDIVIAREBORN` (rama `main`).
2. Framework: Next.js (se detecta solo). No cambies los comandos: `npm run build` ya ejecuta
   `prisma generate`. **Las migraciones no se aplican en el build**: se aplican a mano con
   `npm run db:deploy` (ver runbook).
3. El primer deploy puede fallar por falta de variables: es normal, se repite al final del paso 3.

## 2. Base de datos (Neon desde Vercel Storage)

Sigue [`migracion-bd.md`](migracion-bd.md) completo: respaldo, ensayo en una rama de Neon,
conexión de la base al proyecto (**Storage → Connect Project**), migraciones, auditorías y
noticias.

- Al conectar la base, Vercel crea solas `DATABASE_URL` (con pooler) y `DATABASE_URL_UNPOOLED`
  (directa) en Production y Preview. No las escribas a mano.
- Región de la base: **Washington, D.C. (`iad1`)**, igual que las funciones (`vercel.json` fija
  `"regions": ["iad1"]`).

## 3. Variables de entorno

1. **Storage → Blob → Create store** y conéctalo al proyecto: crea `BLOB_READ_WRITE_TOKEN`.
2. **Settings → Environment Variables → Import .env**: carga `.env.produccion` (archivo local,
   fuera de git) con los valores completados, en Production y Preview.
3. Redeploy (**Deployments → ⋯ → Redeploy**).

| Variable                                                  | Valor                                                                         | Obligatoria          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED`                  | las crea Vercel al conectar la base Neon (paso 2)                             | sí                   |
| `DATABASE_POOL_MAX`                                       | `5` (opcional)                                                                | no                   |
| `AUTH_SECRET`                                             | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | sí                   |
| `NEXT_PUBLIC_APP_URL`                                     | `https://www.asesoriasvaldivia.cl`                                            | sí                   |
| `AUTH_URL`                                                | no hace falta en Vercel (se detecta)                                          | no                   |
| `RESEND_API_KEY`                                          | API key de Resend                                                             | para correos         |
| `EMAIL_FROM`                                              | `Asesorías Valdivia <contacto@asesoriasvaldivia.cl>`                          | para correos         |
| `EMAIL_TO`                                                | `contacto@asesoriasvaldivia.cl`                                               | para correos         |
| `BLOB_READ_WRITE_TOKEN`                                   | lo crea Vercel al conectar el Blob store                                      | para subir archivos  |
| `DAEMON_URL`                                              | la escribe sola el PC del daemon (paso 6)                                     | para automatización  |
| `DAEMON_SECRET`                                           | el mismo valor que en el `.env` del daemon                                    | para automatización  |
| `CRON_SECRET`                                             | cadena aleatoria larga (Vercel la envía al cron)                              | para el recordatorio |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile                                                          | opcional             |

> `NEXT_PUBLIC_APP_URL` se incrusta al compilar: si la cambias, vuelve a desplegar.
> En Preview puedes usar la URL `*.vercel.app` del deploy.

- **Settings → Functions**: la región queda en `iad1` por `vercel.json`.
- **Settings → Cron Jobs**: debe aparecer `/api/cron/boletas-reminder` (diario 23:00 UTC). Solo
  corre en Production.

## 4. Preview y prueba de humo

Antes de tocar el dominio, en la URL `*.vercel.app` del deploy:

- [ ] Las páginas públicas cargan con imágenes (si faltan, ver [`imagenes.md`](imagenes.md)).
- [ ] Un usuario **existente** inicia sesión con su contraseña de siempre.
- [ ] Un formulario de contacto llega a la bandeja `/dashboard/mensajes` y por correo a `EMAIL_TO`.
- [ ] `/dashboard/estado` (ADMIN): base conectada, correo configurado, «Enviar correo de prueba» OK.
- [ ] Subir una foto de perfil funciona (Blob).
- [ ] Recuperar contraseña envía el correo y el enlace funciona.

## 5. Dominio

1. Vercel → proyecto → **Settings → Domains** → agrega `www.asesoriasvaldivia.cl` y
   `asesoriasvaldivia.cl`. Marca `www` como principal y que el apex redirija a `www` (308).
2. En el proveedor DNS del dominio, crea los registros que muestra Vercel:
   - `www` → **CNAME** al valor que indica Vercel (p. ej. `cname.vercel-dns.com.`).
   - Apex `@` → **A** a la IP que indica Vercel. Hoy el apex apunta a otro hosting
     (`208.91.188.30`, que muestra un «Index of /» vacío): hay que reemplazar ese registro.
3. Espera a que Vercel marque ambos dominios como **Valid Configuration** (el certificado HTTPS se
   emite solo).
4. Confirma que `NEXT_PUBLIC_APP_URL` sea `https://www.asesoriasvaldivia.cl` y redeploya.
5. Search Console: envía `https://www.asesoriasvaldivia.cl/sitemap.xml`.

## 6. PC del daemon (automatización SII)

El script `iniciar.ps1` del PC de la oficina abre el túnel de Cloudflare, escribe la URL nueva en
la variable `DAEMON_URL` del proyecto de Vercel y fuerza un redeploy. Hay que apuntarlo al
**proyecto nuevo**:

1. En el `.env` de la carpeta del daemon (no en este repo):
   - `VERCEL_PROJECT_ID` = ID del proyecto nuevo (Vercel → proyecto → Settings → General →
     Project ID).
   - `VERCEL_TEAM_ID` = ID del equipo, solo si el proyecto nuevo está en un team.
   - `VERCEL_TOKEN` = token con acceso a ese proyecto/equipo (Account Settings → Tokens).
   - `DAEMON_SECRET` = el mismo valor que pusiste en Vercel.
2. En `iniciar.ps1`, el redeploy usa el **nombre del proyecto antiguo** escrito a mano
   (`"newasesoriasvaldivia"`, en las líneas que arman `$redeployBody`). Cámbialo por el nombre del
   proyecto nuevo en Vercel; si no, la variable se actualiza pero el redeploy puede fallar y el sitio
   seguiría usando la URL vieja del túnel.
3. Ejecuta `iniciar_daemon.bat` y espera el mensaje «DAEMON_URL actualizada en Vercel».
4. En el panel → **Automatización**, el indicador debe decir «Daemon conectado».

Cada vez que el PC se reinicia, el túnel cambia de URL y el script repite este proceso (incluido el
redeploy, que tarda 1–2 minutos).

## 7. Verificación final

- [ ] `https://asesoriasvaldivia.cl` redirige a `https://www.asesoriasvaldivia.cl`.
- [ ] Todas las URLs antiguas responden: `/`, `/nosotros`, `/servicios`, `/noticias`, `/contacto`,
      `/cotiza`, `/solicitude`, `/misionvision`, `/privacidad`, `/terminosdeuso`, `/auth/login`,
      `/auth/forgot-password`, `/auth/reset-password`, `/dashboard`.
- [ ] Un TEAM lanza una boleta de prueba y ve el progreso.
- [ ] Lighthouse móvil ≥ 90 en `/` y `/servicios` (PageSpeed Insights).

## Variables que ya no se usan

Del sitio anterior se eliminan `NEXTAUTH_SECRET`, `NEXTAUTH_URL` y `SENDGRID_API_KEY`: no las
copies al proyecto nuevo. Las `PG*` / `POSTGRES_*` que agrega Vercel al conectar la base Neon no
estorban; el sitio solo lee `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
