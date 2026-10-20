# Imágenes y recursos gráficos

Las imágenes **no se copian automáticamente** desde el sitio anterior: se insertan a mano en
`public/` con **los mismos nombres y rutas** que tenían (el código las referencia así, p. ej.
`/logouno.png`, `/Carouselimageone.jpg`).

## Pasos al insertar o reemplazar imágenes

1. Copia los archivos a `public/` (misma ruta y nombre, respetando mayúsculas: en Vercel
   `Carouselimageone.jpg` ≠ `carouselimageone.jpg`).
2. Ejecuta:

   ```bash
   npm run images:optimize
   ```

   - Redimensiona (fotos a 2400 px de ancho como máximo, PNG a 1920 px) y recomprime
     **conservando nombre y extensión**, así que ninguna ruta cambia.
   - Guarda el original en `assets-originales/` (fuera de git y del deploy). Si vuelves a
     correr el script, parte desde ese original: no se degrada la calidad.
   - Falla si `public/` supera 15 MB.

3. Revisa el resultado en el navegador y haz commit de `public/`.

`npm run images:check` solo verifica el límite de 15 MB (útil antes de un deploy).

El navegador recibe AVIF/WebP generados por `next/image` a partir de estos archivos.

## Respaldo de originales

`assets-originales/` puede pesar más de 100 MB, por eso está en `.gitignore` y en
`.vercelignore`. Guárdala fuera del repositorio (p. ej. en la carpeta de Google Drive de la
oficina) si quieres conservar las versiones en alta resolución.

## Archivos esperados

Imágenes usadas por el sitio (se irá completando a medida que se construyen las páginas):

| Uso       | Archivos                                                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marca     | `logouno.png`, `isotipouno.png`, `isotipodos.png`, `favicon.ico` (en `src/app/`)                                                                                  |
| Fondos    | `fondodegradado.png`, `fondoaboutus.png`                                                                                                                          |
| Flechas   | `flechaazulderecha.png`, `flechaazulizquierda.png`, `flechagranderesponsiva.png`, `iconoflechagrande.png`                                                         |
| Íconos    | `icononuestrosservicios.png`, `iconoblog.png`, `iconoasesorias.png`, `iconoescribenos.png`, `iconohonestidad.png`, `iconoresponsabilidad.png`, `iconorespeto.png` |
| Hero      | `Carouselimageone.jpg`, `Carouselimagetwo.jpg`, `Carouselimagethree.jpg`                                                                                          |
| Banners   | `bannercierredos.jpg`, `bannerextrados.jpg`, `bannerescribennos.png`, `bannerclientescontacto.jpg`, `bannernoticias.jpg`, `BannerServiciosPage.jpg`               |
| Servicios | `cardasesoriascontables.png`, `cardasesorialaboral.png`, `cardasesoriatributaria.png`, `cardauditoria.png`                                                        |
| Noticias  | `CardNoticiasUno.jpg` … `CardNoticiasCuatro.jpg`, `CardServiciosUno.jpg`                                                                                          |
| Equipo    | `credencialricardo.png`, `credencialgabriela.png`, `credencialariel.png`, `credencialhector.png`, `credencialjesus.png`                                           |
| Clientes  | `client1.png` … `client40.(png\|jpeg)` (ver `src/content/clientes.ts`)                                                                                            |
| Recursos  | `pdfs/pdfrecursoweb.pdf` (hoy se sirve en producción; puede estar referenciado en la BD)                                                                          |

> **No copies** `public/excels/` del sitio anterior: contiene datos reales de clientes y claves
> SII. La plantilla Excel nueva (fase 5) usa datos ficticios.
