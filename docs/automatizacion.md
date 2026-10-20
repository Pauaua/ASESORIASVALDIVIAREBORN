# Automatización SII

El panel (ADMIN y TEAM) lanza procesos en el **daemon** que corre en un PC de la oficina
(`../DAEMON/daemon.py`, FastAPI + Selenium). El daemon se expone a internet con un túnel rápido de
Cloudflare (`trycloudflare.com`) y el sitio le habla a través de `/api/automation`.

```
Navegador ──► /api/automation (Vercel, valida sesión y rol) ──► DAEMON_URL (túnel) ──► daemon.py ──► SII
```

- Permiso: `automatizacion.ejecutar` (ADMIN y TEAM). CLIENT recibe 403.
- La **clave SII** viaja en el cuerpo de la petición y nunca se registra, guarda ni devuelve. El
  formulario la borra después de lanzar el proceso.
- Los RUT se validan con módulo 11 (cliente y servidor) y se envían al daemon **tal como se
  escribieron**.

## Contrato con el daemon (no cambia)

| Acción             | Daemon                          | Cuerpo                          | Timeout |
| ------------------ | ------------------------------- | ------------------------------- | ------- |
| Health             | `GET /health` → `{ ok: true }`  | —                               | 10 s    |
| Listar jobs        | `GET /jobs`                     | —                               | 10 s    |
| Estado             | `GET /status/{job_id}`          | —                               | 10 s    |
| Detener            | `POST /stop/{job_id}`           | —                               | 10 s    |
| Boleta individual  | `POST /run/boletas/individual`  | JSON                            | 15 s    |
| Factura individual | `POST /run/facturas/individual` | JSON                            | 15 s    |
| Boletas masivo     | `POST /run/boletas/masivo`      | multipart `archivo`, `headless` | 30 s    |
| Facturas masivo    | `POST /run/facturas/masivo`     | multipart `archivo`             | 30 s    |

Todas llevan el header `x-daemon-secret: ${DAEMON_SECRET}`. El código está en `src/lib/daemon.ts`
y `src/app/api/automation/route.ts` (`maxDuration = 60`).

Respuestas del proxy: si falta `DAEMON_URL` → 503; si el daemon o el túnel responden algo que no es
JSON → 502 con `{ error, raw }` (primeros 500 caracteres); si no hay conexión → 502. El panel consulta
el estado cada 2,5 s y muestra las últimas 80 líneas de log; si el daemon responde 404 a un job
muestra «Job no encontrado (daemon reiniciado)».

## Archivos masivos y plantillas

- Formatos `.xlsx`, `.xls` o `.csv` de hasta 10 MB. **En Vercel** el cuerpo de una función no puede
  superar 4,5 MB: un Excel más grande falla antes de llegar al servidor. Los Excel de boletas pesan
  normalmente unos pocos KB, así que en la práctica no es un problema.
- Plantillas con datos ficticios en `public/plantillas/` (se descargan desde el panel). Se
  regeneran con `npm run plantillas` (`scripts/generar-plantillas.ts`).
- **Nunca** subas al repositorio un Excel real: contiene claves del SII de los clientes.

## Probar sin el PC de la oficina: mock del daemon

```bash
npm run mock:daemon          # http://localhost:8765, secreto "dev-secret"
```

En `.env`:

```
DAEMON_URL=http://localhost:8765
DAEMON_SECRET=dev-secret
```

El mock simula jobs con progreso y logs. Casos borde:

- RUT emisor/empresa que empieza con `99` → el job termina en error.
- Un Excel cuyo nombre contiene `html` → el mock responde HTML (simula el túnel caído → 502).
- Reiniciar el mock pierde los jobs → el panel muestra «Job no encontrado (daemon reiniciado)».

## Recordatorio mensual de boletas

`/api/cron/boletas-reminder` (cron de Vercel en `vercel.json`, todos los días a las 23:00 UTC). El
último día del mes en hora de Chile envía un correo a todos los ADMIN activos. Requiere
`CRON_SECRET` (Vercel lo envía como `Authorization: Bearer …`) y el correo configurado (Resend).

## Estado del sistema

`/dashboard/estado` (solo ADMIN) muestra si el daemon responde, si la base y el correo están
configurados, qué variables de entorno están definidas (nunca sus valores) y permite enviar un
correo de prueba. Reemplaza al antiguo `?action=debug`.
