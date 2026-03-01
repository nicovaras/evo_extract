#!/usr/bin/env bash
# apply-map.sh — Aplica un mapa JSON exportado desde el editor al juego.
# Uso: ./apply-map.sh [ruta-al-json]
# Si no se pasa argumento, usa map-editor/default-map.json

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${1:-$ROOT/map-editor/default-map.json}"

if [ ! -f "$SRC" ]; then
  echo "❌ No se encontró el archivo: $SRC"
  exit 1
fi

echo "📦 Aplicando mapa: $SRC"

# 1. Copiar a map-editor/default-map.json (fuente canónica para el servidor)
if [ "$SRC" != "$ROOT/map-editor/default-map.json" ]; then
  cp "$SRC" "$ROOT/map-editor/default-map.json"
  echo "  ✅ Copiado a map-editor/default-map.json"
fi

# 2. Copiar al public del cliente (para el fetch del browser)
cp "$ROOT/map-editor/default-map.json" "$ROOT/client/public/default-map.json"
echo "  ✅ Copiado a client/public/default-map.json"

# 3. Re-buildar el servidor
echo "  🔨 Compilando servidor..."
cd "$ROOT/server" && npm run build
echo "  ✅ Servidor compilado"

echo ""
echo "✅ Mapa aplicado. Reinicia el servidor para que tome efecto."
