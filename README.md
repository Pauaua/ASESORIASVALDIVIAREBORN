# Asesorías Valdivia

Sitio web y panel de clientes de **Asesorías Valdivia**, firma contable de Antofagasta, Chile
([asesoriasvaldivia.cl](https://www.asesoriasvaldivia.cl)).

Reescritura del sitio anterior con Next.js 16 (App Router, Cache Components), TypeScript estricto,
Tailwind CSS v4 + shadcn/ui, Prisma 7 (PostgreSQL en Railway) y Auth.js. Se despliega en Vercel.

> Proyecto en construcción. Este README se completa al final de la fase 7.

## Requisitos

- Node.js 22 o superior
- Docker Desktop (Postgres local de desarrollo)

## Desarrollo local

```bash
npm install                 # también genera el cliente de Prisma
cp .env.example .env        # y completa AUTH_SECRET (ver comentarios del archivo)
docker compose up -d        # Postgres 17 en localhost:5434
npm run db:deploy           # aplica las migraciones
npm run db:seed             # usuarios y recursos de prueba (solo desarrollo)
npm run dev
```

Abre <http://localhost:3000>. El seed crea `admin@dev.local`, `equipo@dev.local` y
`cliente@dev.local`, todos con la contraseña `Desarrollo.2026`.

## Scripts

| Script                    | Qué hace                                                      |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Servidor de desarrollo                                        |
| `npm run build`           | Genera el cliente de Prisma y compila para producción         |
| `npm run lint`            | ESLint                                                        |
| `npm run typecheck`       | Tipos de rutas de Next + `tsc --noEmit`                       |
| `npm run format`          | Prettier (con orden de clases de Tailwind)                    |
| `npm run db:migrate`      | Crea/aplica migraciones en desarrollo (`prisma migrate dev`)  |
| `npm run db:deploy`       | Aplica migraciones pendientes (`prisma migrate deploy`)       |
| `npm run db:seed`         | Datos de prueba (se niega a correr contra una base no local)  |
| `npm run images:optimize` | Optimiza `public/` conservando rutas (ver `docs/imagenes.md`) |
| `npm run images:check`    | Verifica que `public/` pese menos de 15 MB                    |

## Documentación

- [`docs/migracion-bd.md`](docs/migracion-bd.md): migración de la base Neon → Railway.
- [`docs/imagenes.md`](docs/imagenes.md): cómo insertar y optimizar imágenes.

## Base de datos

El esquema (`prisma/schema.prisma`) conserva los nombres de tablas y columnas de la base del sitio
anterior, por lo que los datos se importan sin transformaciones. Todo cambio de esquema debe ser
**aditivo**. Las migraciones de producción se aplican a mano (`npm run db:deploy`), nunca en el
build.
