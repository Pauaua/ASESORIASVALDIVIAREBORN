/**
 * Optimiza las imágenes de `public/` EN EL MISMO LUGAR, conservando nombre y extensión
 * (las rutas como `/Carouselimageone.jpg` no cambian).
 *
 * - Redimensiona (nunca agranda): fotos JPEG/WebP a 2400 px de ancho como máximo; PNG a
 *   1920 px (varios PNG de la marca son en realidad fotos y pesan mucho).
 * - JPEG: mozjpeg, calidad 75, progresivo. PNG: paleta cuantizada (conserva transparencia).
 *   WebP: calidad 78.
 * - El original se respalda la primera vez en `assets-originales/` (misma ruta relativa) y,
 *   en ejecuciones siguientes, se vuelve a procesar DESDE ese respaldo: el resultado es
 *   reproducible y no se degrada al correr el script varias veces.
 * - Solo se reemplaza un archivo si la versión optimizada pesa menos.
 * - Al final informa el peso de `public/` y falla si supera el límite (15 MB).
 *
 * El navegador recibe AVIF/WebP igualmente: lo genera `next/image` al vuelo.
 *
 * Uso:
 *   npm run images:optimize                 # optimiza public/
 *   npm run images:optimize -- --dry-run    # solo informa, no escribe
 *   npm run images:check                    # solo verifica el límite de peso
 *   tsx scripts/optimize-images.ts --dir otra/carpeta --backup otra/respaldo
 */
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const MAX_WIDTH = { photo: 2400, png: 1920 }
const PUBLIC_LIMIT_BYTES = 15 * 1024 * 1024
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const option = (name: string, fallback: string) => {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1]! : fallback
}

const root = process.cwd()
const targetDir = path.resolve(root, option('--dir', 'public'))
const backupDir = path.resolve(root, option('--backup', 'assets-originales'))
const dryRun = flag('--dry-run')
const checkOnly = flag('--check')

const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`
const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

async function folderSize(dir: string) {
  let total = 0
  for await (const file of walk(dir)) total += (await stat(file)).size
  return total
}

async function optimize(file: string) {
  const ext = path.extname(file).toLowerCase()
  const relative = path.relative(targetDir, file)
  const backup = path.join(backupDir, relative)

  // Fuente de verdad: el respaldo si existe; si no, el archivo actual.
  const source = existsSync(backup) ? backup : file
  const before = (await stat(file)).size

  // Se lee a memoria: en Windows sharp deja abierto el archivo de origen y la escritura
  // posterior sobre la misma ruta falla con EBUSY.
  const image = sharp(await readFile(source), { failOn: 'error' }).rotate() // orientación EXIF
  const { width = 0 } = await image.metadata()
  const maxWidth = ext === '.png' ? MAX_WIDTH.png : MAX_WIDTH.photo
  const pipeline = width > maxWidth ? image.resize({ width: maxWidth }) : image

  const output =
    ext === '.png'
      ? await pipeline
          .png({ palette: true, quality: 80, effort: 10, compressionLevel: 9 })
          .toBuffer()
      : ext === '.webp'
        ? await pipeline.webp({ quality: 78, effort: 6 }).toBuffer()
        : await pipeline.jpeg({ quality: 75, mozjpeg: true, progressive: true }).toBuffer()

  if (output.length >= before) {
    return { relative, before, after: before, changed: false }
  }

  if (!dryRun) {
    if (!existsSync(backup)) {
      await mkdir(path.dirname(backup), { recursive: true })
      await copyFile(file, backup)
    }
    await writeFile(file, output)
  }
  return { relative, before, after: output.length, changed: true }
}

async function main() {
  if (!existsSync(targetDir)) {
    console.log(`No existe ${path.relative(root, targetDir)}/: nada que optimizar.`)
    return
  }

  if (!checkOnly) {
    let saved = 0
    for await (const file of walk(targetDir)) {
      if (!EXTENSIONS.has(path.extname(file).toLowerCase())) continue
      try {
        const result = await optimize(file)
        if (result.changed) {
          saved += result.before - result.after
          console.log(
            `✔ ${result.relative}: ${formatKB(result.before)} → ${formatKB(result.after)}`,
          )
        } else {
          console.log(`· ${result.relative}: ya optimizada (${formatKB(result.before)})`)
        }
      } catch (error) {
        process.exitCode = 1
        console.error(`✖ ${path.relative(targetDir, file)}: ${(error as Error).message}`)
      }
    }
    console.log(`\nAhorro${dryRun ? ' estimado' : ''}: ${formatMB(saved)}`)
  }

  const total = await folderSize(targetDir)
  const label = path.relative(root, targetDir) || '.'
  if (total > PUBLIC_LIMIT_BYTES && !dryRun) {
    process.exitCode = 1
    console.error(`✖ ${label}/ pesa ${formatMB(total)} (límite ${formatMB(PUBLIC_LIMIT_BYTES)})`)
  } else {
    console.log(`${label}/ pesa ${formatMB(total)} (límite ${formatMB(PUBLIC_LIMIT_BYTES)})`)
  }
}

void main()
