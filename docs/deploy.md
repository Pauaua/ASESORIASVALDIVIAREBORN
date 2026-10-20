# Despliegue: Vercel + Railway + dominio

Guía para poner en producción el sitio nuevo. El proyecto antiguo de Vercel ya no existe, así que
el dominio se conecta directamente al proyecto nuevo.

Orden recomendado:

1. Base de datos en Railway (y migración de datos) → [`migracion-bd.md`](migracion-bd.md)
2. Proyecto de Vercel con sus variables
3. Deploy de preview y prueba de humo
4. Dominio
5. PC del daemon apuntando al proyecto nuevo
6. Verificación final

## 1. Railway (PostgreSQL)

Sigue [`migracion-bd.md`](migracion-bd.md) completo: crea la base, restaura el respaldo de Neon,
aplica las migraciones (`npm run db:deploy`), corre las auditorías y siembra las noticias
(`npm run noticias:sembrar -- --url "<url>"`).

- Región: **us-east4** (Virginia), la más cercana a las funciones de Vercel en `iad1`
  (`vercel.json` ya fija `"regions": ["iad1"]`).
- Usa la **URL pública** de Railway con `?sslmode=no-verify` al final.
- Si aparecen errores `too many connections`, agrega PgBouncer en Railway (sección 10 del runbook)
  o baja `DATABASE_POOL_MAX`.

## 2. Proyecto de Vercel

1. Vercel → **Add New → Project** → importa `Pauaua/ASESORIASVALDIVIAREBORN` (rama `main`).
2. Framework: Next.js (se detecta solo). No cambies los comandos: `npm run build` ya ejecuta
   `prisma generate`. **Las migraciones no se aplican en el build**: se aplican a mano con
   `npm run db:deploy` (ver runbook).
3. **Storage → Blob → Create store** y conéctalo al proyecto: crea `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables** (Production y Preview):

| Variable                                                  | Valor                                                                         | Obligatoria          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- |
| `DATABASE_URL`                                            | URL pública de Railway + `?sslmode=no-verify`                                 | sí                   |
| `DATABASE_POOL_MAX`                                       | `5` (opcional)                                                                | no                   |
| `AUTH_SECRET`                                             | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | sí                   |
| `NEXT_PUBLIC_APP_URL`                                     | `https://www.asesoriasvaldivia.cl`                                            | sí                   |
| `AUTH_URL`                                                | no hace falta en Vercel (se detecta)                                          | no                   |
| `RESEND_API_KEY`                                          | API key de Resend                                                             | para correos         |
| `EMAIL_FROM`                                              | `Asesorías Valdivia <contacto@asesoriasvaldivia.cl>`                          | para correos         |
| `EMAIL_TO`                                                | `contacto@asesoriasvaldivia.cl`                                               | para correos         |
| `BLOB_READ_WRITE_TOKEN`                                   | lo crea Vercel al conectar el Blob store                                      | para subir archivos  |
| `DAEMON_URL`                                              | la escribe sola el PC del daemon (paso 5)                                     | para automatización  |
| `DAEMON_SECRET`                                           | el mismo valor que en el `.env` del daemon                                    | para automatización  |
| `CRON_SECRET`                                             | cadena aleatoria larga (Vercel la envía al cron)                              | para el recordatorio |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile                                                          | opcional             |

> `NEXT_PUBLIC_APP_URL` se incrusta al compilar: si la cambias, vuelve a desplegar.
> En Preview puedes usar la URL `*.vercel.app` del deploy.

5. **Settings → Functions**: la región queda en `iad1` por `vercel.json`.
6. **Settings → Cron Jobs**: debe aparecer `/api/cron/boletas-reminder` (diario 23:00 UTC). Solo
   corre en Production.

## 3. Preview y prueba de humo

Antes de tocar el dominio, en la URL `*.vercel.app` del deploy:

- [ ] Las páginas públicas cargan con imágenes (si faltan, ver [`imagenes.md`](imagenes.md)).
- [ ] Un usuario **existente** inicia sesión con su contraseña de siempre.
- [ ] Un formulario de contacto llega a la bandeja `/dashboard/mensajes` y por correo a `EMAIL_TO`.
- [ ] `/dashboard/estado` (ADMIN): base conectada, correo configurado, «Enviar correo de prueba» OK.
- [ ] Subir una foto de perfil funciona (Blob).
- [ ] Recuperar contraseña envía el correo y el enlace funciona.

## 4. Dominio

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

## 5. PC del daemon (automatización SII)

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

## 6. Verificación final

- [ ] `https://asesoriasvaldivia.cl` redirige a `https://www.asesoriasvaldivia.cl`.
- [ ] Todas las URLs antiguas responden: `/`, `/nosotros`, `/servicios`, `/noticias`, `/contacto`,
      `/cotiza`, `/solicitude`, `/misionvision`, `/privacidad`, `/terminosdeuso`, `/auth/login`,
      `/auth/forgot-password`, `/auth/reset-password`, `/dashboard`.
- [ ] Un TEAM lanza una boleta de prueba y ve el progreso.
- [ ] Lighthouse móvil ≥ 90 en `/` y `/servicios` (PageSpeed Insights).

## Variables que ya no se usan

Del sitio anterior se eliminan: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SENDGRID_API_KEY` y todas las
`PG*` / `POSTGRES_*` de Neon. No las copies al proyecto nuevo.
