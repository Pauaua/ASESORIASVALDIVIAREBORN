# Runbook: migración de la base de datos Neon (Vercel Postgres) → Railway

Este procedimiento lo ejecuta **la dueña del sitio**, no se automatiza. El flujo completo se ensayó
localmente con el esquema real del sitio anterior (dump → restore → verificación de deriva →
baseline → migraciones aditivas → inserción nueva) sin diferencias.

> **Regla de oro:** la base de Neon NO se modifica. Solo se lee con `pg_dump`. Si algo sale mal,
> el sitio anterior sigue funcionando contra Neon y basta con no cambiar el dominio.

## 0. Requisitos

- Docker Desktop (para usar `pg_dump`/`pg_restore` sin instalarlos).
- El repo nuevo clonado, con `npm install` hecho.
- Git Bash. En Git Bash antepone `MSYS_NO_PATHCONV=1` a los comandos `docker` que lleven rutas
  como `/backup/...` (si no, Git Bash las convierte en rutas de Windows).

Variables que usarás (no las guardes en el repo):

```bash
# Neon: usa la URL SIN pooler (DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING del proyecto
# Vercel antiguo; el host NO contiene "-pooler"). pg_dump no funciona bien a través del pooler.
export NEON_URL='postgresql://usuario:clave@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require'

# Railway: URL PÚBLICA (Postgres → Connect → Public Network). Para pg_dump/pg_restore
# (libpq) usa sslmode=require.
export RAILWAY_URL='postgresql://postgres:clave@xxxx.proxy.rlwy.net:12345/railway?sslmode=require'
```

## 1. Crear la base en Railway

1. Railway → New Project → Database → **PostgreSQL**.
2. Región: **US East (Virginia)**. Railway no tiene región en Sudamérica; Virginia es la más
   cercana a la región de funciones de Vercel que usaremos (**`iad1`, Washington D.C.**). Así cada
   consulta viaja ~1–2 ms en vez de cruzar el continente.
3. Versión de Postgres: igual o mayor que la de Neon. Revisa la de Neon con:

   ```bash
   docker run --rm postgres:17-alpine psql "$NEON_URL" -tAc "show server_version"
   ```

   Usa una imagen `postgres:<versión>` ≥ a la del servidor de Neon en todos los comandos de abajo
   (`pg_dump` debe ser de igual o mayor versión que el servidor).

## 2. Ventana de corte

Los formularios públicos siguen escribiendo en Neon hasta que el dominio apunte al proyecto nuevo.
Para no perder mensajes:

1. Haz un **ensayo completo** (pasos 3–7) contra una base de Railway de prueba cuando quieras.
2. El día del cambio: dump final (paso 3) → restore (4) → verificación (5–7) → cambio de dominio,
   en el menor tiempo posible (en general menos de 15 minutos).
3. Después del cambio, compara de nuevo los conteos de `ContactForm` y `CotizationForm` en Neon y
   Railway (paso 5). Si entró algún mensaje en Neon durante la ventana, cópialo a mano desde la
   tabla de Neon (son pocos campos) o reenvíalo a la bandeja.

## 3. Dump de Neon (solo lectura)

```bash
mkdir -p backup
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/backup:/backup" postgres:17-alpine \
  pg_dump "$NEON_URL" -Fc --no-owner --no-acl -f /backup/asesorias-$(date +%Y%m%d-%H%M).dump
```

- `-Fc` formato custom (comprimido, permite restaurar selectivamente).
- `--no-owner --no-acl`: no arrastra los roles/permisos de Neon, que no existen en Railway.

Guarda el archivo `.dump` en un lugar seguro (contiene datos personales y hashes de contraseñas).
`backup/` está fuera de git, no lo subas.

## 4. Restore en Railway

La base de Railway debe estar **vacía** (recién creada).

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD/backup:/backup" postgres:17-alpine \
  pg_restore --no-owner --no-acl -d "$RAILWAY_URL" /backup/asesorias-AAAAMMDD-HHMM.dump
```

Puede avisar que el esquema `public` ya existe: es normal.

## 5. Verificar conteos por tabla

Ejecuta lo mismo en ambas bases y compara:

```bash
CONTEO="select 'Users', count(*) from \"Users\"
union all select 'ContactForm', count(*) from \"ContactForm\"
union all select 'CotizationForm', count(*) from \"CotizationForm\"
union all select 'Resource', count(*) from \"Resource\"
union all select 'File', count(*) from \"File\""

docker run --rm postgres:17-alpine psql "$NEON_URL"    -tAc "$CONTEO"
docker run --rm postgres:17-alpine psql "$RAILWAY_URL" -tAc "$CONTEO"
```

Los cinco números deben coincidir.

## 6. Secuencias de autoincrement

`pg_dump` incluye el valor actual de cada secuencia, así que normalmente no hay nada que hacer.
Para asegurarse (es idempotente y no daña nada):

```bash
docker run --rm postgres:17-alpine psql "$RAILWAY_URL" -c '
select setval(pg_get_serial_sequence($$"Users"$$, $$id$$),          coalesce(max(id), 1), max(id) is not null) from "Users";
select setval(pg_get_serial_sequence($$"ContactForm"$$, $$id$$),    coalesce(max(id), 1), max(id) is not null) from "ContactForm";
select setval(pg_get_serial_sequence($$"CotizationForm"$$, $$id$$), coalesce(max(id), 1), max(id) is not null) from "CotizationForm";
select setval(pg_get_serial_sequence($$"Resource"$$, $$id$$),       coalesce(max(id), 1), max(id) is not null) from "Resource";
select setval(pg_get_serial_sequence($$"File"$$, $$id$$),           coalesce(max(id), 1), max(id) is not null) from "File";'
```

## 7. Baseline de Prisma y migraciones aditivas

La base antigua se creó con `prisma db push` (sin historial de migraciones). Hay que decirle a
Prisma que la migración `0_init` ya está aplicada y luego aplicar las nuevas, que son **solo
aditivas** (columnas nuevas con default; no borran ni renombran nada).

Para los comandos de Prisma usa la URL de Railway con `sslmode=no-verify` (ver nota en
`.env.example`):

```bash
export DATABASE_URL="${RAILWAY_URL/sslmode=require/sslmode=no-verify}"

# 7.1 Verificar que la base importada es EXACTAMENTE el esquema del sitio anterior.
#     Debe decir "No difference detected." (exit code 0). Si muestra diferencias, DETENTE.
npx prisma migrate diff --from-config-datasource \
  --to-schema docs/migracion/schema-sitio-anterior.prisma --exit-code

# 7.2 Marcar la baseline como aplicada (no ejecuta SQL).
npx prisma migrate resolve --applied 0_init

# 7.3 Aplicar las migraciones nuevas.
npx prisma migrate deploy

# 7.4 Verificar que la base quedó igual al esquema actual: "No difference detected."
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Las migraciones de producción se aplican siempre así, a mano con `npm run db:deploy`, **nunca** en
el build de Vercel.

## 8. Auditorías posteriores (solo lectura)

```bash
# Emails con mayúsculas y colisiones al pasarlos a minúsculas.
npx tsx scripts/auditar-emails.ts

# Archivos de recursos sin categoría (quedaron así en el sitio anterior al borrar categorías).
npx tsx scripts/auditar-archivos-huerfanos.ts
```

- Si `auditar-emails` no muestra colisiones, normaliza con
  `npx tsx scripts/auditar-emails.ts --apply`. Si hay colisiones, el script se niega: decide cuál
  cuenta conservar y corrígela a mano antes.
- Archivos huérfanos: la migración `archivos_cascade` (aplicada en 7.3) hace que borrar una
  categoría borre sus archivos, pero no toca los huérfanos que ya existen (no se ven en el panel).
  Revisa la lista y decide:
  - asignarlos a una categoría: `npx tsx scripts/auditar-archivos-huerfanos.ts --asignar <id> --confirmar`
  - eliminarlos: `npx tsx scripts/auditar-archivos-huerfanos.ts --eliminar --confirmar`

  Sin `--confirmar` el script solo muestra lo que haría.

## 9. Prueba de humo

Con `DATABASE_URL` de Railway en un deploy de preview de Vercel:

1. Inicia sesión con un usuario real con su contraseña actual (los hashes bcrypt `$2a$`/`$2b$`
   del sitio anterior se verificaron compatibles con `bcryptjs`).
2. Revisa que el panel muestre usuarios, clientes, recursos y mensajes.
3. Envía un formulario de contacto de prueba y verifica que aparece en la bandeja.

## 10. Conexiones: Vercel serverless + Railway

- Railway no trae pooler. Cada instancia de función de Vercel abre su propio pool, limitado por
  `DATABASE_POOL_MAX` (5 por defecto; ver `src/lib/db.ts`). Con el tráfico del sitio esto alcanza
  de sobra: el Postgres de Railway acepta 100 conexiones por defecto.
- En Vercel, fija la región de funciones en **`iad1`** (se configura en `vercel.json` en la fase de
  entrega), junto a la base en Virginia.
- **Si aparece `too many connections`:** agrega PgBouncer en el mismo proyecto de Railway
  (plantilla "PgBouncer" del marketplace de Railway, apuntando a la base), y cambia
  `DATABASE_URL` en Vercel a la URL pública de PgBouncer. Empieza en modo `transaction`; si
  aparecen errores de _prepared statements_, cambia a modo `session`. Baja también
  `DATABASE_POOL_MAX` a 2–3. Las migraciones (`prisma migrate`) deben seguir usando la URL directa
  de Postgres, no la de PgBouncer.

## 11. Vuelta atrás

Hasta que cambie el dominio, no hay nada que revertir: el sitio en producción sigue usando Neon.
Después del cambio, revertir es volver a apuntar el dominio al proyecto antiguo de Vercel (que
sigue conectado a Neon). Los mensajes que entraron mientras tanto quedan en Railway y se pueden
copiar de vuelta igual que en el paso 2.
