#!/usr/bin/env bash
#
# Convierte un vídeo apaisado (16:9) al formato vertical 1080x1920 de TikTok.
#
# Pensado para los Video Overview de Gemini Notebook (antes NotebookLM), que
# salen en 1280x720 con diapositivas. Recortarlos al centro NO sirve: se come
# la mitad del texto de cada lámina. En su lugar el vídeo entero se coloca
# dentro de un lienzo vertical sobre fondo oscuro de marca.
#
# El fondo es sólido y no el propio vídeo desenfocado: las láminas de Notebook
# son blancas, y desenfocar blanco da gris lechoso contra el que el vídeo no
# se despega. Con el azul oscuro sí contrasta y además se ve deliberado.
#
# También quita la marca de agua "Gemini Notebook" de la esquina inferior
# derecha recortando el borde de abajo, que en estas láminas va vacío.
#
#   ./scripts/video-vertical.sh entrada.mp4 [salida.mp4] ["Título en pantalla"]
#
# Sin título, se deriva del nombre del archivo (Control_Financiero → CONTROL
# FINANCIERO). Con "" como tercer argumento, no se dibuja ninguno.
#
set -euo pipefail

ENTRADA="${1:?Uso: $0 <entrada.mp4> [salida.mp4] [\"Título\"]}"
SALIDA="${2:-${ENTRADA%.*}-vertical.mp4}"

command -v ffmpeg  >/dev/null || { echo "Falta ffmpeg. macOS: brew install ffmpeg" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "Falta ffprobe (viene con ffmpeg)" >&2; exit 1; }
[ -f "$ENTRADA" ] || { echo "No existe: $ENTRADA" >&2; exit 1; }

# Título: si no se pasa, se saca del nombre del archivo. Se limpian los
# caracteres que drawtext interpreta (: \ ') para no romper el filtro.
if [ $# -ge 3 ]; then TITULO="$3"
else
  TITULO=$(basename "${ENTRADA%.*}" | sed 's/^[0-9a-f]*-//; s/[_-]/ /g' | tr '[:lower:]' '[:upper:]')
fi
TITULO=$(printf '%s' "$TITULO" | sed "s/[:\\\\']//g")

FUENTE="${FUENTE:-/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf}"
[ -f "$FUENTE" ] || { echo "No encuentro la fuente: $FUENTE (pásala con FUENTE=/ruta.ttf)" >&2; exit 1; }

FONDO="${FONDO:-0x0f172a}"   # azul oscuro de TallerOS
ACENTO="${ACENTO:-0x60a5fa}"
RECORTE_INFERIOR="${RECORTE_INFERIOR:-64}"   # borra la marca de agua (empieza en y≈662 de 720)

IFS=, read -r ANCHO ALTO < <(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height -of csv=p=0 "$ENTRADA")
ALTO_UTIL=$((ALTO - RECORTE_INFERIOR))

# El vídeo va a 1040 de ancho para dejar un marco blanco de 6 px que lo separa
# del fondo. La altura se redondea a par porque libx264 la necesita divisible por 2.
ANCHO_VIDEO=1040
ALTO_VIDEO=$(( (ANCHO_VIDEO * ALTO_UTIL / ANCHO) / 2 * 2 ))
Y_VIDEO=620   # por encima del centro: TikTok tapa la franja inferior con su interfaz

echo "→ ${ANCHO}x${ALTO} → 1080x1920   vídeo ${ANCHO_VIDEO}x${ALTO_VIDEO} en y=${Y_VIDEO}"
[ -n "$TITULO" ] && echo "→ título: ${TITULO}"

CAPA_TITULO=""
[ -n "$TITULO" ] && CAPA_TITULO=",drawtext=fontfile=${FUENTE}:text='${TITULO}':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=430"

ffmpeg -hide_banner -loglevel error -y -i "$ENTRADA" -filter_complex "
  color=c=${FONDO}:s=1080x1920:r=30[fondo];
  [0:v]crop=${ANCHO}:${ALTO_UTIL}:0:0,scale=${ANCHO_VIDEO}:${ALTO_VIDEO},
       pad=iw+12:ih+12:6:6:white[primerplano];
  [fondo][primerplano]overlay=(W-w)/2:${Y_VIDEO}:shortest=1
  ${CAPA_TITULO},
  drawtext=fontfile=${FUENTE}:text='tallerosapp.com':fontcolor=${ACENTO}:fontsize=38:x=(w-text_w)/2:y=1700[salida]
" -map "[salida]" -map 0:a? \
  -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 128k -movflags +faststart \
  "$SALIDA"

echo "✓ $SALIDA"
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height \
        -of default=noprint_wrappers=1 "$SALIDA"
