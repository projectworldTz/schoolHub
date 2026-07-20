#!/usr/bin/env bash
# Pulls the latest main, applies backend migrations/caches, and publishes
# the frontend build to its docroot. Run from the repo root on the server
# after pushing to GitHub: ./deploy.sh
#
# Everything lives inside main() and main is invoked as the very last line:
# this script's own git merge below overwrites deploy.sh on disk while it's
# running, and bash only buffers a function body into memory once, as one
# unit, before executing any of it — so the currently-running copy is safe
# from that self-modification. Without this wrapper, statements after the
# merge could silently keep running whatever the file's content was BEFORE
# the pull, even though later invocations pick up the new version fine.
set -euo pipefail

log() { echo "==> $*"; }

main() {
  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  BACKEND_DIR="$REPO_DIR/backend"
  FRONTEND_DIST_DIR="$REPO_DIR/frontend/dist"
  FRONTEND_DOCROOT="/home/projectw/public_html/schoolhub.projectworldtz.com"
  BRANCH="main"

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

  # Diffed against the previous run's recorded position, not just this
  # run's BEFORE/AFTER — if a prior run (or a manual git pull) already
  # landed a commit, this run's own BEFORE==AFTER would otherwise make a
  # real composer.lock change invisible to it.
  LAST_DEPLOYED_MARKER="$REPO_DIR/.last-deployed-commit"
  PREVIOUS_DEPLOY=$(cat "$LAST_DEPLOYED_MARKER" 2>/dev/null || echo "$BEFORE")
  CHANGED_FILES=$(git diff --name-only "$PREVIOUS_DEPLOY" "$AFTER" 2>/dev/null || echo "")

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
  # route:cache is intentionally skipped: routes/web.php registers a
  # closure route, and Laravel's route cache can't serialize closures.

  # Always publish, unconditionally — a few small static files, cheap
  # enough that "only if changed" isn't worth the fragility it caused.
  log "Publishing frontend/dist to $FRONTEND_DOCROOT"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$FRONTEND_DIST_DIR/" "$FRONTEND_DOCROOT/"
  else
    find "$FRONTEND_DOCROOT" -mindepth 1 -delete
    cp -r "$FRONTEND_DIST_DIR/." "$FRONTEND_DOCROOT/"
  fi

  echo "$AFTER" > "$LAST_DEPLOYED_MARKER"

  log "Deploy complete."
}

main "$@"
