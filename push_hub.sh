#!/usr/bin/env bash
# push_hub.sh — Deploy del Hub AMG ampliado (Mayo–Diciembre 2026, 35 semanas, 175 piezas)
#               + todos los artes brand_amg/ + brand_kicab/
# Correr desde tu Mac, en la carpeta AMG-Pylori que tienes abierta en Cowork.

set -e
cd "$(dirname "$0")"

# 1. Limpiar lock huérfano si sobrevive de alguna sesión previa
rm -f .git/index.lock || true

# 2. Stage: HTML principal, .gitignore, y TODO el HUB_AMG_PYLORI (brand_amg + brand_kicab + claude)
#    El .gitignore ya excluye el Infografía Prensa.pdf (32 MB) que se comparte por separado.
git add .gitignore
git add sistema_piezas_AMG_Hub.html
git add HUB_AMG_PYLORI/

# Muestra resumen antes del commit
echo ""
echo "=== Archivos que se van a commitear ==="
git diff --cached --stat | tail -20
echo "======================================="
echo ""

# 3. Commit
git commit -m "Hub AMG · Mayo–Diciembre 2026 (35 semanas, 175 piezas) + artes brand

HTML:
- claims[] extendido de 12 → 35 semanas (fotos, cifras, headlines por pilar)
- 8 bloques de justificación mensual (fase, hito, mensaje madre, por qué)
- buildCarrusel5() → 5 slides IG 4:5 (cover · dato · síntoma · llamado · CTA)
- buildTikTokCover() → cover 9:16 + guión 3 beats (hook · desarrollo · CTA)
- CAL_SCHEDULE 5 formatos/semana: IG 4:5 · LinkedIn 16:9 · Carrusel · TikTok · FB 1:1
- Header: 'Campaña avalada AMG · Mayo–Diciembre 2026 · 35 semanas · 175 piezas'

Artes:
- brand_amg/: 5 Arte_0X.png + bases + hispánica_* + logos + estómago + caja + mapa
- brand_amg/Artes_campaña/: 7 artboards finales de campaña
- brand_amg/Artes_campaña_deteccion/: artboards + freepik posters/flyers
- brand_kicab/: actualizaciones de kicab_hombre_caja y kicab_mujer_caja"

# 4. Push a main → GitHub Pages rebuilea en ~2 min
git push origin main

echo ""
echo "✓ Push completo. Verificar en ~2 minutos:"
echo "  https://robcarpinteyro.github.io/amg-pylori-hub/sistema_piezas_AMG_Hub.html"
echo ""
echo "Si GitHub advierte por tamaño de algún archivo, avísame y lo migramos a Git LFS."
