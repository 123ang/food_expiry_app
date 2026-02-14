#!/usr/bin/env bash
#
# Deploy Expiry Alert backend and/or web-app.
# Run from repo root after pulling changes (e.g. on VPS: git pull && ./deploy.sh).
#
# Usage:
#   ./deploy.sh          # deploy both backend and web-app
#   ./deploy.sh backend  # deploy backend only (build + pm2 restart)
#   ./deploy.sh webapp   # deploy web-app only (build; nginx serves build/)
#

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

PM2_APP_NAME="${PM2_APP_NAME:-expiry-alert-api}"

do_backend() {
  echo "========== Deploying backend =========="
  cd "$REPO_ROOT/backend"

  echo "Installing dependencies..."
  npm ci

  echo "Building..."
  npm run build

  if pm2 describe "$PM2_APP_NAME" &>/dev/null; then
    echo "Restarting PM2 app: $PM2_APP_NAME"
    pm2 restart "$PM2_APP_NAME"
  else
    echo "Starting PM2 app: $PM2_APP_NAME (port 3006)"
    pm2 start dist/app.js --name "$PM2_APP_NAME"
    echo "Tip: run 'pm2 save' and 'pm2 startup' to persist across reboots."
  fi

  echo "Backend deploy done."
}

do_webapp() {
  echo "========== Deploying web-app =========="
  cd "$REPO_ROOT/web-app/expiry-alert"

  echo "Installing dependencies..."
  npm ci

  echo "Building production bundle..."
  npm run build

  echo "Web-app deploy done. Nginx serves from: web-app/expiry-alert/build"
}

case "${1:-all}" in
  backend)
    do_backend
    ;;
  webapp|web-app)
    do_webapp
    ;;
  all)
    do_backend
    echo ""
    do_webapp
    ;;
  *)
    echo "Usage: $0 [backend|webapp|all]"
    echo "  backend  - build backend and pm2 restart $PM2_APP_NAME"
    echo "  webapp   - build web-app (nginx serves build/)"
    echo "  all      - deploy both (default)"
    exit 1
    ;;
esac
