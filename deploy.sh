#!/usr/bin/env bash
# Pulls the latest main, applies backend migrations/caches, and publishes
# any updated frontend build to its docroot. Run from the repo root on the
# server after pushing to GitHub: ./deploy.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIST_DIR="$REPO_DIR/frontend/dist"
FRONTEND_DOCROOT="/home/projectw/public_html/schoolhub.projectworldtz.com"
BRANCH="main"

log() { echo "==> $*"; }

log "Deploying SchoolHub Africa ($(date '+%Y-%m-%d %H:%M:%S'))"

cd "$REPO_DIR"

log "Fetching latest code from origin/$BRANCH"
git fetch origin "$BRANCH"

BEFORE=$(git rev-parse HEAD)
git merge --ff-only "origin/$BRANCH"
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  log "Already up to date ($AFTER)"
else
  log "Updated $BEFORE -> $AFTER"
fi

CHANGED_FILES=$(git diff --name-only "$BEFORE" "$AFTER")

cd "$BACKEND_DIR"

if echo "$CHANGED_FILES" | grep -q '^backend/composer\.lock$'; then
  log "composer.lock changed - running composer install"
  if command -v composer >/dev/null 2>&1; then
    composer install --no-dev --optimize-autoloader --no-interaction
  elif [ -f composer.phar ]; then
    php composer.phar install --no-dev --optimize-autoloader --no-interaction
  else
    log "ERROR: composer not found (checked PATH and ./composer.phar). Install dependencies manually, then re-run."
    exit 1
  fi
fi

log "Running migrations"
php artisan migrate --force

log "Rebuilding caches"
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan view:clear
php artisan view:cache
# route:cache is intentionally skipped: routes/web.php registers a closure
# route, and Laravel's route cache can't serialize closures.

if echo "$CHANGED_FILES" | grep -q '^frontend/dist/'; then
  log "frontend/dist changed - publishing to $FRONTEND_DOCROOT"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$FRONTEND_DIST_DIR/" "$FRONTEND_DOCROOT/"
  else
    find "$FRONTEND_DOCROOT" -mindepth 1 -delete
    cp -r "$FRONTEND_DIST_DIR/." "$FRONTEND_DOCROOT/"
  fi
else
  log "No frontend changes - skipping publish"
fi

log "Deploy complete."
