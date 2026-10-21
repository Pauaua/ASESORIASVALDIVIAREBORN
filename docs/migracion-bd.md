# Runbook: base de datos en Neon (conectada desde Vercel)

> **Ejecutado el 2026-10-20** (escenario B): respaldo `backup/asesorias-20261020-2145.dump` →
> restaurado solo el esquema `public` en `asesorias-valdivia-db` (conteos idénticos) → se eliminó
> en la base nueva la tabla huérfana `RoleEnum` y su tipo `RoleEnum_value` (vacía, sin
> referencias, de un esquema antiguo; el paso 6.1 la marcaba como diferencia) → baseline y
> migraciones sin diferencias → auditorías limpias → 6 noticias sembradas. La base antigua
> (`ep-winter-boat`) no se modificó y queda como respaldo. El esquema `neon_auth` de la base
> antigua (Neon Auth, que el sitio no usa) no se migró.

Este procedimiento lo ejecuta **la dueña del sitio**, no se automatiza. El flujo
(dump → restore → verificación de deriva → baseline → migraciones aditivas → inserción nueva) se
ensayó localmente con el esquema real del sitio anterior sin diferencias.

La base vive en **Neon** y se conecta al proyecto de Vercel desde **Storage**: Vercel crea solo
`DATABASE_URL` (conexión con pooler, la que usa el sitio) y `DATABASE_URL_UNPOOLED` (conexión
directa, la que usan `pg_dump` y las migraciones de Prisma).

> **Regla de oro:** antes de tocar nada, respalda (paso 2) y ensaya todo en una **rama de Neon**
> (paso 3). La base principal solo se modifica cuando el ensayo salió limpio.

## 0. Requisitos

- Docker Desktop (para usar `pg_dump`/`pg_restore`/`psql` sin instalarlos).
- El repo nuevo clonado, con `npm install` hecho.
- Git Bash. En Git Bash antepone `MSYS_NO_PATHCONV=1` a los comandos `docker` que lleven rutas
  como `/backup/...` (si no, Git Bash las convierte en rutas de Windows).

Las URLs de conexión se copian de **console.neon.tech → proyecto → Connect**:

- **Directa**: desactiva «Connection pooling». El host **no** contiene `-pooler`.
- **Con pooler**: activa «Connection pooling». El host contiene `-pooler`.

```bash
# No las guardes en el repo. Siempre la URL DIRECTA para respaldos y migraciones.
export NEON_DIRECTA='postgresql://usuario:clave@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require'
```

> Si un comando de Prisma reclama por un parámetro de la URL, quita `&channel_binding=require`
> del final.

## 1. ¿Existe todavía la base del sitio anterior?

Borrar el proyecto antiguo de Vercel **no** borra su base: las bases de Storage pertenecen a la
cuenta. Revisa **Vercel → Storage** (y/o [console.neon.tech](https://console.neon.tech)):

- **A. Sigue ahí** → se reutiliza. Sigue los pasos 2, 3, 5, 6, 7 y 8 (el 4 no aplica).
- **B. No está** → se crea una nueva y se restaura un respaldo. Necesitas un `.dump` de la base
  antigua. Sigue los pasos 4 a 8. Si no hay respaldo, no hay datos que migrar: basta con
  `npm run db:deploy` sobre la base vacía, pero el primer ADMIN habrá que crearlo directamente en
  la base (el sitio no tiene registro público y `db:seed` se niega a correr fuera de local).

La base antigua es Postgres 17 y la nueva (`asesorias-valdivia-db`, creada desde Vercel en
`iad1`) es Postgres 18; por eso los comandos usan la imagen `postgres:18-alpine` (sus `pg_dump` y
`pg_restore` sirven para ambas). Para revisar la versión de una base:

```bash
docker run --rm postgres:18-alpine psql "$NEON_DIRECTA" -tAc "show server_version"
```

## 2. Respaldo (siempre, antes de cualquier cambio)

```bash
mkdir -p backup
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/backup:/backup" postgres:18-alpine \
  pg_dump "$NEON_DIRECTA" -Fc --no-owner --no-acl -f /backup/asesorias-$(date +%Y%m%d-%H%M).dump
```

- `-Fc`: formato custom (comprimido, permite restaurar selectivamente).
- `--no-owner --no-acl`: no arrastra roles ni permisos.

Guarda el `.dump` en un lugar seguro (contiene datos personales y hashes de contraseñas).
`backup/` está fuera de git: no lo subas.

## 3. Ensayo en una rama de Neon (escenario A)

Una rama de Neon es una copia instantánea de la base, independiente: lo que hagas en ella no
afecta a la principal.

1. console.neon.tech → proyecto → **Branches → Create branch**, desde la rama principal
   (`main` o `production`). Nombre: `ensayo-migracion`.
2. Copia la URL **directa** de la rama y ejecuta con ella los pasos 6 y 7:

   ```bash
   export NEON_DIRECTA='<URL directa de la rama ensayo-migracion>'
   ```

3. Si todo sale limpio, borra la rama y repite los pasos 6 y 7 con la URL directa de la rama
   principal. Si algo falla, borra la rama: la base principal sigue intacta.

## 4. Crear la base y restaurar (escenario B)

1. Vercel → **Storage → Create Database → Neon**.
   - Región: **Washington, D.C., USA (East) – `iad1`** (AWS us-east-1), la misma de las funciones
     del sitio (`vercel.json` fija `"regions": ["iad1"]`).
   - Plan: el gratuito alcanza para el tráfico del sitio (límites en neon.tech/pricing).
2. Conéctala al proyecto (paso 5) y copia su URL directa (console.neon.tech → Connect).
3. Restaura el respaldo. La base debe estar **vacía**:

   ```bash
   MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/backup:/backup" postgres:18-alpine \
     pg_restore --no-owner --no-acl -d "$NEON_DIRECTA" /backup/asesorias-AAAAMMDD-HHMM.dump
   ```

   Puede avisar que el esquema `public` ya existe: es normal.

4. Compara los conteos con los del respaldo (restaura el mismo `.dump` en el Postgres local de
   Docker si no tienes la base antigua a mano):

   ```bash
   CONTEO="select 'Users', count(*) from \"Users\"
   union all select 'ContactForm', count(*) from \"ContactForm\"
   union all select 'CotizationForm', count(*) from \"CotizationForm\"
   union all select 'Resource', count(*) from \"Resource\"
   union all select 'File', count(*) from \"File\""

   docker run --rm postgres:18-alpine psql "$NEON_DIRECTA" -tAc "$CONTEO"
   ```

5. Secuencias de autoincrement. `pg_dump` las incluye, así que normalmente no hay nada que hacer;
   esto lo asegura (idempotente):

   ```bash
   docker run --rm postgres:18-alpine psql "$NEON_DIRECTA" -c '
   select setval(pg_get_serial_sequence($$"Users"$$, $$id$$),          coalesce(max(id), 1), max(id) is not null) from "Users";
   select setval(pg_get_serial_sequence($$"ContactForm"$$, $$id$$),    coalesce(max(id), 1), max(id) is not null) from "ContactForm";
   select setval(pg_get_serial_sequence($$"CotizationForm"$$, $$id$$), coalesce(max(id), 1), max(id) is not null) from "CotizationForm";
   select setval(pg_get_serial_sequence($$"Resource"$$, $$id$$),       coalesce(max(id), 1), max(id) is not null) from "Resource";
   select setval(pg_get_serial_sequence($$"File"$$, $$id$$),           coalesce(max(id), 1), max(id) is not null) from "File";'
   ```

## 5. Conectar la base al proyecto de Vercel

Vercel → **Storage** → la base → **Connect Project** → el proyecto nuevo, con los entornos
**Production** y **Preview**.

Revisa en **Settings → Environment Variables** que existan `DATABASE_URL` y
`DATABASE_URL_UNPOOLED`:

- Vercel también agrega `PGHOST`, `POSTGRES_URL`, etc. No estorban; el sitio no las usa.
- Si la base es del sitio anterior y **solo** aparecen las `POSTGRES_*`, crea a mano
  `DATABASE_URL` con el valor de `POSTGRES_URL` y `DATABASE_URL_UNPOOLED` con el de
  `POSTGRES_URL_NON_POOLING`.

## 6. Baseline de Prisma y migraciones aditivas

La base antigua se creó con `prisma db push` (sin historial de migraciones). Hay que decirle a
Prisma que la migración `0_init` ya está aplicada y luego aplicar las nuevas, que son **solo
aditivas** (tablas y columnas nuevas con default; no borran ni renombran nada).

Siempre con la URL **directa** (el pooler no admite los bloqueos que usa `prisma migrate`):

```bash
export DATABASE_URL="$NEON_DIRECTA"

# 6.1 Verificar que la base es EXACTAMENTE el esquema del sitio anterior.
#     Debe decir "No difference detected." (exit code 0). Si muestra diferencias, DETENTE.
npx prisma migrate diff --from-config-datasource \
  --to-schema docs/migracion/schema-sitio-anterior.prisma --exit-code

# 6.2 Marcar la baseline como aplicada (no ejecuta SQL).
npx prisma migrate resolve --applied 0_init

# 6.3 Aplicar las migraciones nuevas.
npx prisma migrate deploy

# 6.4 Verificar que la base quedó igual al esquema actual: "No difference detected."
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Las migraciones de producción se aplican siempre así, a mano con `npm run db:deploy`, **nunca** en
el build de Vercel. `prisma.config.ts` usa `DATABASE_URL_UNPOOLED` cuando existe, así que también
funcionan con las variables bajadas de Vercel (`vercel env pull`).

## 7. Auditorías y noticias

Con la misma `DATABASE_URL` directa del paso 6:

```bash
# Emails con mayúsculas y colisiones al pasarlos a minúsculas (solo lectura).
npx tsx scripts/auditar-emails.ts

# Archivos de recursos sin categoría (solo lectura).
npx tsx scripts/auditar-archivos-huerfanos.ts
```

- Si `auditar-emails` no muestra colisiones, normaliza con
  `npx tsx scripts/auditar-emails.ts --apply`. Si hay colisiones, el script se niega: decide cuál
  cuenta conservar y corrígela a mano antes.
- Archivos huérfanos: la migración `archivos_cascade` (aplicada en 6.3) hace que borrar una
  categoría borre sus archivos, pero no toca los huérfanos que ya existen (no se ven en el panel).
  Revisa la lista y decide:
  - asignarlos a una categoría: `npx tsx scripts/auditar-archivos-huerfanos.ts --asignar <id> --confirmar`
  - eliminarlos: `npx tsx scripts/auditar-archivos-huerfanos.ts --eliminar --confirmar`

  Sin `--confirmar` el script solo muestra lo que haría.

La tabla `Post` (migración `noticias`) nace vacía. Carga las 6 noticias del sitio anterior, con sus
fuentes (idempotente: no toca las que ya existan):

```bash
npm run noticias:sembrar -- --url "$NEON_DIRECTA"
```

## 8. Prueba de humo

En un deploy de preview de Vercel (ya conectado a la base):

1. Inicia sesión con un usuario real con su contraseña actual (los hashes bcrypt `$2a$`/`$2b$`
   del sitio anterior se verificaron compatibles con `bcryptjs`).
2. Revisa que el panel muestre usuarios, clientes, recursos y mensajes.
3. Envía un formulario de contacto de prueba y verifica que aparece en la bandeja.
4. `/dashboard/estado` debe mostrar la base conectada.

## 9. Conexiones y suspensión

- El sitio usa `DATABASE_URL` (con pooler de Neon), que admite miles de conexiones de clientes.
  Cada instancia de función abre como máximo `DATABASE_POOL_MAX` (5 por defecto; ver
  `src/lib/db.ts`).
- Neon **suspende** el cómputo tras unos minutos sin consultas. La primera consulta después
  despierta la base en ~0,5–1 s; el resto va a velocidad normal. Si molesta, en los planes de pago
  se puede desactivar la suspensión (Neon → Branch → Compute → Scale to zero).

## 10. Vuelta atrás

- Antes de las migraciones: no hay nada que revertir.
- Si algo sale mal después: Neon permite **restaurar la rama a un momento anterior**
  (console.neon.tech → Restore; la ventana depende del plan). Como último recurso, restaura el
  `.dump` del paso 2 en una base vacía.
