# Asesorías Valdivia

Sitio web y panel de clientes de **Asesorías Valdivia**, firma contable de Antofagasta, Chile
([asesoriasvaldivia.cl](https://www.asesoriasvaldivia.cl)).

- **Sitio público**: inicio, quiénes somos, servicios, noticias, contacto, cotización, solicitud de
  registro, misión y visión, privacidad y términos de uso.
- **Panel** (`/dashboard`) con tres roles:
  - **ADMIN**: usuarios, clientes, servicios, recursos, bandeja de mensajes, automatización SII,
    noticias y estado del sistema.
  - **TEAM**: clientes (lectura y link de Drive), recursos, mensajes y automatización SII.
  - **CLIENT**: su perfil e información comercial, y sus recursos (incluida su carpeta de Drive).
- **Automatización SII**: emisión de boletas de honorarios y aceptación de facturas a través del
  daemon del PC de la oficina ([`docs/automatizacion.md`](docs/automatizacion.md)).

## Stack

Next.js 16 (App Router, Cache Components, Server Actions) · React 19 · TypeScript estricto ·
Tailwind CSS v4 + shadcn/ui (Radix) · lucide-react · Prisma 7 + PostgreSQL (Neon) ·
Auth.js v5 (credenciales, JWT) · Zod + react-hook-form · Resend + React Email · Vercel Blob ·
Vitest + Playwright. Se despliega en Vercel.

## Requisitos

- Node.js 22 o superior
- Docker Desktop (Postgres local de desarrollo)

## Desarrollo local

```bash
npm install                 # también genera el cliente de Prisma
cp .env.example .env        # completa AUTH_SECRET (ver comentarios del archivo)
docker compose up -d        # Postgres 17 en localhost:5434
npm run db:deploy           # aplica las migraciones
npm run db:seed             # usuarios y recursos de prueba (solo desarrollo)
npm run noticias:sembrar    # las 6 noticias iniciales
npm run dev
```

Abre <http://localhost:3000>. El seed crea `admin@dev.local`, `equipo@dev.local` y
`cliente@dev.local`, todos con la contraseña `Desarrollo.2026`.

Para probar la automatización sin el PC de la oficina: `npm run mock:daemon` y en `.env`
`DAEMON_URL="http://localhost:8765"`, `DAEMON_SECRET="dev-secret"`.

Las imágenes del sitio no están en el repositorio hasta que se inserten en `public/`
([`docs/imagenes.md`](docs/imagenes.md)).

## Scripts

| Script                                                  | Qué hace                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                                           | Servidor de desarrollo                                                         |
| `npm run build` / `npm start`                           | Compila para producción / sirve el build                                       |
| `npm run lint` · `npm run typecheck` · `npm run format` | ESLint · tipos · Prettier                                                      |
| `npm test`                                              | Pruebas unitarias (Vitest): permisos por rol, validadores, RUT, automatización |
| `npm run test:e2e`                                      | Pruebas end-to-end (Playwright) contra la base local y el mock del daemon      |
| `npm run db:migrate`                                    | Crea/aplica migraciones en desarrollo                                          |
| `npm run db:deploy`                                     | Aplica migraciones pendientes (producción: a mano, nunca en el build)          |
| `npm run db:seed`                                       | Datos de prueba (se niega a correr contra una base no local)                   |
| `npm run noticias:sembrar`                              | Carga las noticias iniciales (idempotente; acepta `-- --url`)                  |
| `npm run mock:daemon`                                   | Daemon de automatización simulado en el puerto 8765                            |
| `npm run plantillas`                                    | Regenera las plantillas Excel de ejemplo (`public/plantillas/`)                |
| `npm run images:optimize` / `images:check`              | Optimiza `public/` / verifica que pese < 15 MB                                 |

### Pruebas end-to-end

```bash
npm run build
npm run test:e2e        # levanta `next start` y el mock; usa la base LOCAL (Docker)
```

El setup siembra la base de desarrollo, limpia el rate limit e inicia sesión una vez por rol. Si ya
tienes `npm run dev` abierto en el puerto 3000, lo reutiliza. Incluye una revisión de accesibilidad
(axe) del panel.

## Estructura

```
src/
  app/(public)/           sitio público y páginas de acceso (/auth/…)
  app/dashboard/          panel: layout con sidebar y una ruta por sección
  app/api/                auth (Auth.js), automation (proxy al daemon), upload (Blob), cron
  components/site|dashboard|ui
  content/                textos del sitio (servicios, equipo, clientes, legales…)
  emails/                 plantillas React Email
  lib/                    db, auth, rbac (matriz de permisos), session, daemon, rut,
                          actions/ (Server Actions), data/ (lecturas), validators/ (Zod)
  proxy.ts                redirecciones por sesión y rol
prisma/                   esquema, migraciones y seed de desarrollo
scripts/                  optimización de imágenes, auditorías, mock del daemon, plantillas
tests/unit · tests/e2e
docs/
```

## Seguridad

- **Permisos**: `src/lib/rbac.ts` es la fuente de verdad. Cada Server Action y Route Handler
  verifica el permiso en el servidor; el proxy y la UI solo ocultan o redirigen.
- Nadie puede activarse, desactivarse, cambiarse el rol ni eliminarse a sí mismo, y nunca queda el
  sistema sin un ADMIN activo. Una cuenta desactivada pierde la sesión en ≤ 60 s.
- Rate limit en Postgres (login, recuperación de contraseña y formularios) + honeypot; Turnstile
  opcional. Cabeceras CSP, HSTS, nosniff, Referrer-Policy y Permissions-Policy (`next.config.ts`).
- Nunca se devuelven `password`, `resetToken` ni `resetTokenExpires` (select explícito en
  `src/lib/data/usuarios.ts`). La clave SII no se registra ni se guarda.
- `npm audit --omit=dev` sin vulnerabilidades. Las que reporta `npm audit` completo vienen de
  herramientas de desarrollo (CLI de shadcn y exceljs) que no llegan a producción.

## Contenido editable

- Servicios, equipo, valores, textos del hero y logos de clientes: `src/content/*.ts`.
  - **Pendiente**: textos alternativos de los logos de clientes (`alt` en
    `src/content/clientes.ts`) y el apellido de Jesús (`src/content/equipo.ts`).
- Noticias: desde el panel (`/dashboard/noticias`).
- Recursos para clientes: desde el panel (`/dashboard/recursos`).

## Fuente

`src/app/fonts/OverusedGrotesk-VF.woff` es el archivo original. El sitio usa
`OverusedGrotesk-VF-latin.woff2` (subconjunto latino, 40 KB en vez de 108 KB), generado con:

```bash
pip install fonttools brotli
pyftsubset src/app/fonts/OverusedGrotesk-VF.woff --flavor=woff2 --layout-features='*' \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --output-file=src/app/fonts/OverusedGrotesk-VF-latin.woff2
```

## Documentación

- [`docs/deploy.md`](docs/deploy.md): Vercel, variables, dominio y PC del daemon.
- [`docs/migracion-bd.md`](docs/migracion-bd.md): base de datos en Neon conectada desde Vercel (respaldo, migraciones, auditorías).
- [`docs/automatizacion.md`](docs/automatizacion.md): automatización SII, contrato con el daemon y mock.
- [`docs/imagenes.md`](docs/imagenes.md): cómo insertar y optimizar imágenes.

## Base de datos

El esquema (`prisma/schema.prisma`) conserva los nombres de tablas y columnas de la base del sitio
anterior, por lo que los datos se importan sin transformaciones. Todo cambio de esquema debe ser
**aditivo**. Las migraciones de producción se aplican a mano (`npm run db:deploy`), nunca en el
build.
