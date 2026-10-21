# Asesorías Valdivia

Sitio web y panel de clientes de **Asesorías Valdivia**, firma de servicios contables, laborales,
tributarios y de auditoría de Antofagasta, Chile.

**Producción:** [www.asesoriasvaldivia.cl](https://www.asesoriasvaldivia.cl)

## Qué es

El proyecto reúne en una sola aplicación la presencia pública de la firma y las herramientas
internas con las que trabaja con sus clientes:

- **Sitio público** para dar a conocer la firma y captar clientes.
- **Panel privado** donde el equipo administra usuarios, clientes, recursos, mensajes y noticias,
  y donde cada cliente consulta su información y sus documentos.
- **Automatización SII** que emite boletas de honorarios y acepta facturas en el portal del SII a
  partir de una planilla Excel, ejecutada por un servicio en el PC de la oficina.

## Funcionalidades

### Sitio público

| Página                                          | Ruta                                   |
| ----------------------------------------------- | -------------------------------------- |
| Inicio (carrusel, servicios, clientes, accesos) | `/`                                    |
| Quiénes somos y equipo                          | `/nosotros`                            |
| Misión, visión y valores                        | `/misionvision`                        |
| Servicios                                       | `/servicios`                           |
| Noticias y artículos                            | `/noticias`, `/noticias/[slug]`        |
| Contacto                                        | `/contacto`                            |
| Cotización                                      | `/cotiza`                              |
| Solicitud de registro de cliente                | `/solicitude`                          |
| Privacidad y términos de uso                    | `/privacidad`, `/terminosdeuso`        |
| Acceso y recuperación de clave                  | `/auth/login`, `/auth/forgot-password` |

- Los formularios se guardan en la base de datos y avisan por correo a la firma.
- SEO: metadatos por página, sitemap, `robots.txt`, imagen para redes sociales y datos
  estructurados (JSON-LD) en las noticias.
- Diseño responsivo, accesible (WCAG 2.1 AA) y con imágenes optimizadas (AVIF/WebP).

### Panel (`/dashboard`)

El acceso depende del rol:

| Sección                  | ADMIN |              TEAM              |              CLIENT               |
| ------------------------ | :---: | :----------------------------: | :-------------------------------: |
| Perfil                   |   ✓   |               ✓                | ✓ (con su información comercial)  |
| Usuarios                 |   ✓   |                                |                                   |
| Clientes                 |   ✓   | ✓ (lectura y carpeta de Drive) |                                   |
| Servicios                |   ✓   |                                |                                   |
| Recursos (PDF y enlaces) |   ✓   |               ✓                | ✓ (lectura y su carpeta de Drive) |
| Mensajes de formularios  |   ✓   |               ✓                |                                   |
| Automatización SII       |   ✓   |               ✓                |                                   |
| Noticias                 |   ✓   |                                |                                   |
| Estado del sistema       |   ✓   |                                |                                   |

- **Usuarios:** alta, edición, activación, cambio de rol y eliminación, con reglas que impiden
  dejar el sistema sin un ADMIN activo o que alguien se desactive a sí mismo.
- **Mensajes:** bandeja de contacto, cotizaciones y solicitudes de registro, con marca de leído,
  exportación a CSV y alta de cliente desde una solicitud.
- **Noticias:** editor en Markdown con vista previa, imagen de portada y publicación.
- **Estado del sistema:** muestra qué servicios están configurados (base de datos, correo,
  archivos, daemon) y permite enviar un correo de prueba.
- **Recordatorio mensual:** correo automático para emitir las boletas de honorarios.

### Automatización SII

El panel envía la planilla al daemon del PC de la oficina a través de un túnel seguro, muestra el
progreso del trabajo en tiempo real y permite detenerlo. La clave SII se usa solo para esa
ejecución: nunca se guarda ni se registra. Detalle y contrato HTTP en
[`docs/automatizacion.md`](docs/automatizacion.md).

## Arquitectura

```
Navegador ──► Vercel (Next.js, región iad1)
                 ├─ Neon (PostgreSQL)          datos: usuarios, formularios, recursos, noticias
                 ├─ Vercel Blob (público)      fotos de perfil, PDF e imágenes de noticias
                 ├─ Resend                     correos transaccionales
                 ├─ Vercel Cron                recordatorio mensual de boletas
                 └─ Túnel Cloudflare ──► Daemon en el PC de la oficina ──► portal del SII
```

- **Server Components y Server Actions** para leer y modificar datos; los permisos se verifican
  siempre en el servidor con una matriz única (`src/lib/rbac.ts`).
- **Cache Components**: las páginas públicas se prerenderizan y las noticias se cachean con
  etiquetas que se invalidan al publicar.
- **Subidas directas** del navegador a Vercel Blob: el servidor solo firma el permiso de subida.

## Stack

Next.js 16 (App Router, Cache Components, Server Actions) · React 19 · TypeScript estricto ·
Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react · Prisma 7 · PostgreSQL (Neon) · Auth.js v5
(credenciales y JWT) · Zod · react-hook-form · Resend + React Email · Vercel Blob · Vitest ·
Playwright · axe-core.

## Desarrollo local

Requisitos: Node.js 22 o superior y Docker Desktop.

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # completa AUTH_SECRET (instrucciones en el archivo)
docker compose up -d        # PostgreSQL local en el puerto 5434
npm run db:deploy           # aplica las migraciones
npm run db:seed             # usuarios y recursos de prueba
npm run noticias:sembrar    # las noticias iniciales
npm run dev
```

Abre <http://localhost:3000>. El seed crea `admin@dev.local`, `equipo@dev.local` y
`cliente@dev.local` con la contraseña `Desarrollo.2026`.

Para probar la automatización sin el PC de la oficina: `npm run mock:daemon` y, en `.env`,
`DAEMON_URL="http://localhost:8765"` y `DAEMON_SECRET="dev-secret"`.

Todas las variables de entorno están documentadas en [`.env.example`](.env.example).

## Scripts

| Script                                                  | Qué hace                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                                           | Servidor de desarrollo                                                  |
| `npm run build` / `npm start`                           | Compila para producción / sirve el build                                |
| `npm run lint` · `npm run typecheck` · `npm run format` | ESLint · tipos · Prettier                                               |
| `npm test`                                              | Pruebas unitarias (permisos por rol, validadores, RUT, automatización)  |
| `npm run test:e2e`                                      | Pruebas end-to-end en escritorio y móvil, con revisión de accesibilidad |
| `npm run db:migrate`                                    | Crea y aplica migraciones en desarrollo                                 |
| `npm run db:deploy`                                     | Aplica migraciones pendientes (en producción, siempre a mano)           |
| `npm run db:seed`                                       | Datos de prueba (se niega a correr contra una base no local)            |
| `npm run noticias:sembrar`                              | Carga las noticias iniciales (idempotente)                              |
| `npm run mock:daemon`                                   | Daemon de automatización simulado                                       |
| `npm run plantillas`                                    | Regenera las plantillas Excel de ejemplo                                |
| `npm run images:optimize` / `images:check`              | Optimiza `public/` / verifica que pese menos de 15 MB                   |

Las pruebas end-to-end requieren un build previo (`npm run build`) y usan la base local de Docker.

## Estructura

```
src/
  app/(public)/      sitio público y páginas de acceso
  app/dashboard/     panel: una ruta por sección
  app/api/           Auth.js, automatización (proxy al daemon), subidas a Blob, cron
  components/        site · dashboard · ui
  content/           textos del sitio: servicios, equipo, clientes, legales
  emails/            plantillas de correo
  lib/               auth, permisos, sesión, base de datos, daemon, RUT,
                     actions/ (Server Actions), data/ (lecturas), validators/ (Zod)
  proxy.ts           redirecciones por sesión y rol
prisma/              esquema, migraciones y seed
scripts/             imágenes, auditorías, mock del daemon, plantillas, noticias
tests/               unit · e2e
docs/                despliegue, base de datos, automatización, imágenes
```

## Seguridad

- Contraseñas con bcrypt; las cuentas del sitio anterior conservan su contraseña.
- Sesión JWT de 7 días que se revalida contra la base: una cuenta desactivada pierde el acceso en
  menos de un minuto.
- Límite de intentos en login, recuperación de contraseña y formularios, más un campo trampa
  contra bots (y captcha Turnstile opcional).
- Cabeceras CSP, HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
- Nunca se devuelven contraseñas ni tokens de recuperación, y la clave SII no se guarda ni se
  registra.

## Contenido editable

- **Servicios, equipo, valores, textos del inicio y logos de clientes:** `src/content/*.ts`.
- **Noticias y recursos:** desde el panel.
- **Imágenes del sitio:** `public/`, ver [`docs/imagenes.md`](docs/imagenes.md).

## Documentación

- [`docs/deploy.md`](docs/deploy.md): Vercel, variables, dominio y PC del daemon.
- [`docs/migracion-bd.md`](docs/migracion-bd.md): base de datos en Neon (respaldo, migraciones,
  auditorías).
- [`docs/automatizacion.md`](docs/automatizacion.md): automatización SII y contrato con el daemon.
- [`docs/imagenes.md`](docs/imagenes.md): cómo insertar y optimizar imágenes.

## Autoría y uso de inteligencia artificial

El diseño, la arquitectura y las ideas de este proyecto son de autoría propia. Se utilizó inteligencia artificial como herramienta de apoyo para agilizar el desarrollo, escribir y ejecutar pruebas, y realizar correcciones.
