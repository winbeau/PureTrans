#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/web-frontend"
DIST_DIR="$WEB_DIR/dist"

API_BASE_URL="${PURETRANS_WEB_API_BASE_URL:-${VITE_API_BASE_URL:-https://winbeau.top}}"
PUBLISH_DIR="${PURETRANS_WEB_PUBLISH_DIR:-/var/www/puretrans-web}"
PUBLISH_OWNER="${PURETRANS_WEB_PUBLISH_OWNER:-www-data:www-data}"
RUN_INSTALL=1
WRITE_ENV=1
RELOAD_NGINX=1
CHOWN_PUBLISH_DIR=1
VERIFY_URL=""

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy-web-frontend.sh [options]

Build and publish the PureTrans React web frontend to the Nginx static directory.

Options:
  --api-base URL        Build-time VITE_API_BASE_URL. Default: https://winbeau.top
  --publish-dir DIR     Static publish directory. Default: /var/www/puretrans-web
  --owner USER:GROUP    Owner applied to published files. Default: www-data:www-data
  --verify-url URL      Optional URL to curl after reload, for example https://winbeau.top/
  --skip-install        Do not run pnpm install --frozen-lockfile
  --skip-env            Do not overwrite web-frontend/.env
  --skip-nginx-reload   Do not run nginx -t or reload nginx
  --no-chown            Do not chown the publish directory
  -h, --help            Show this help

Environment overrides:
  PURETRANS_WEB_API_BASE_URL
  PURETRANS_WEB_PUBLISH_DIR
  PURETRANS_WEB_PUBLISH_OWNER
EOF
}

log() {
  printf '\n\033[1;36m==>\033[0m %s\n' "$*"
}

fail() {
  printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2
  exit 1
}

run_sudo() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

can_publish_without_sudo() {
  local path="$1"

  while [[ ! -e "$path" && "$path" != "/" ]]; do
    path="$(dirname "$path")"
  done

  [[ -w "$path" ]]
}

run_publish() {
  if [[ "$PUBLISH_WITH_SUDO" -eq 1 ]]; then
    run_sudo "$@"
  else
    "$@"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-base)
      API_BASE_URL="${2:-}"
      [[ -n "$API_BASE_URL" ]] || fail "--api-base requires a URL"
      shift 2
      ;;
    --publish-dir)
      PUBLISH_DIR="${2:-}"
      [[ -n "$PUBLISH_DIR" ]] || fail "--publish-dir requires a directory"
      shift 2
      ;;
    --owner)
      PUBLISH_OWNER="${2:-}"
      [[ -n "$PUBLISH_OWNER" ]] || fail "--owner requires USER:GROUP"
      shift 2
      ;;
    --verify-url)
      VERIFY_URL="${2:-}"
      [[ -n "$VERIFY_URL" ]] || fail "--verify-url requires a URL"
      shift 2
      ;;
    --skip-install)
      RUN_INSTALL=0
      shift
      ;;
    --skip-env)
      WRITE_ENV=0
      shift
      ;;
    --skip-nginx-reload)
      RELOAD_NGINX=0
      shift
      ;;
    --no-chown)
      CHOWN_PUBLISH_DIR=0
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ -d "$WEB_DIR" ]] || fail "web-frontend directory not found: $WEB_DIR"
[[ "$PUBLISH_DIR" == /* ]] || fail "--publish-dir must be an absolute path"
[[ "$PUBLISH_DIR" != "/" ]] || fail "--publish-dir cannot be /"
[[ "$PUBLISH_DIR" != "$REPO_ROOT"* ]] || fail "--publish-dir must not be inside the repository"

command -v pnpm >/dev/null 2>&1 || fail "pnpm is not available in PATH"

PUBLISH_WITH_SUDO=0
if [[ "${EUID:-$(id -u)}" -ne 0 ]] && ! can_publish_without_sudo "$PUBLISH_DIR"; then
  PUBLISH_WITH_SUDO=1
fi

if [[ "${EUID:-$(id -u)}" -ne 0 ]] && { [[ "$PUBLISH_WITH_SUDO" -eq 1 ]] || [[ "$CHOWN_PUBLISH_DIR" -eq 1 ]] || [[ "$RELOAD_NGINX" -eq 1 ]]; }; then
  command -v sudo >/dev/null 2>&1 || fail "sudo is required to publish to $PUBLISH_DIR"
fi

log "Repository: $REPO_ROOT"
log "Web frontend: $WEB_DIR"
log "Publish dir: $PUBLISH_DIR"
log "API base URL: $API_BASE_URL"

cd "$WEB_DIR"

if [[ "$RUN_INSTALL" -eq 1 ]]; then
  log "Installing dependencies"
  pnpm install --frozen-lockfile
fi

if [[ "$WRITE_ENV" -eq 1 ]]; then
  log "Writing web-frontend/.env"
  printf 'VITE_API_BASE_URL=%s\n' "$API_BASE_URL" > "$WEB_DIR/.env"
fi

log "Building web frontend"
pnpm build

[[ -f "$DIST_DIR/index.html" ]] || fail "Build did not produce $DIST_DIR/index.html"

log "Publishing dist to $PUBLISH_DIR"
run_publish mkdir -p "$PUBLISH_DIR"
run_publish find "$PUBLISH_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
run_publish cp -a "$DIST_DIR"/. "$PUBLISH_DIR"/

if [[ "$CHOWN_PUBLISH_DIR" -eq 1 ]]; then
  log "Setting ownership to $PUBLISH_OWNER"
  run_sudo chown -R "$PUBLISH_OWNER" "$PUBLISH_DIR"
fi

if [[ "$RELOAD_NGINX" -eq 1 ]]; then
  command -v nginx >/dev/null 2>&1 || fail "nginx is not available in PATH"
  command -v systemctl >/dev/null 2>&1 || fail "systemctl is not available in PATH"
  log "Testing Nginx configuration"
  run_sudo nginx -t
  log "Reloading Nginx"
  run_sudo systemctl reload nginx
fi

if [[ -n "$VERIFY_URL" ]]; then
  command -v curl >/dev/null 2>&1 || fail "curl is not available in PATH"
  log "Verifying $VERIFY_URL"
  curl -fsSI "$VERIFY_URL" >/dev/null
fi

log "Deploy completed"
