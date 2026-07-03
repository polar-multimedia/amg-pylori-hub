#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  auto_deploy.sh — Publicación automática · Hub México Sin Cáncer Gástrico
#  Este script lo ejecuta el daemon. No lo corras a mano.
# ─────────────────────────────────────────────────────────────

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR" || exit 1

LOG="$REPO_DIR/.auto_deploy.log"
MAX_LOG_LINES=500

# ── Rotar log si crece demasiado ─────────────────────────────
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt "$MAX_LOG_LINES" ]; then
  tail -100 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $1" >> "$LOG"; }

log "── Revisando cambios ──────────────────────"

# ── Limpiar locks huérfanos ───────────────────────────────────
rm -f .git/index.lock .git/HEAD.lock .git/MERGE_HEAD.lock 2>/dev/null

# ── Stage: archivos del hub ───────────────────────────────────
git add docs/ firebase.json .gitignore .github/ 2>/dev/null

# ── Contar cambios staged ─────────────────────────────────────
STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')

if [ "$STAGED" = "0" ]; then
  log "Sin cambios. Hub al día."
  exit 0
fi

ARCHIVOS=$(git diff --cached --name-only | tr '\n' '  ')
log "Cambios detectados ($STAGED archivos): $ARCHIVOS"

# ── Commit ────────────────────────────────────────────────────
TS=$(date '+%Y-%m-%d %H:%M')
git commit -m "Auto-deploy $TS" >> "$LOG" 2>&1
COMMIT_STATUS=$?

if [ $COMMIT_STATUS -ne 0 ]; then
  log "✗ Error en commit. Revisa el log."
  osascript -e 'display notification "Error al preparar los archivos" with title "Hub · México Sin Cáncer Gástrico" subtitle "Revisa .auto_deploy.log"' 2>/dev/null
  exit 1
fi

# ── Push ──────────────────────────────────────────────────────
git push origin main >> "$LOG" 2>&1
PUSH_STATUS=$?

if [ $PUSH_STATUS -eq 0 ]; then
  log "✓ Publicado exitosamente → GitHub Pages + Firebase en ~1 min"
  ARCHIVO_CORTO=$(git diff HEAD~1 --name-only 2>/dev/null | head -3 | tr '\n' ', ' | sed 's/,$//')
  osascript -e "display notification \"Firebase actualiza en ~1 min ✓\" with title \"Hub publicado\" subtitle \"$ARCHIVO_CORTO\"" 2>/dev/null
else
  log "✗ Error al hacer push. ¿Expiró el token de GitHub?"
  osascript -e 'display notification "No se pudo publicar. Posible token expirado." with title "Hub · Error" subtitle "Revisa .auto_deploy.log"' 2>/dev/null
  exit 1
fi
