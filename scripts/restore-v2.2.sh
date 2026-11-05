#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Restoring AeroComms VIAA to Version 2.2"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

if [ -d "${ROOT_DIR}/backups/v2.2" ]; then
  echo "--> Restoring from local backup directory backups/v2.2/..."
  cp -rf "${ROOT_DIR}/backups/v2.2/src" "${ROOT_DIR}/"
  cp -rf "${ROOT_DIR}/backups/v2.2/public" "${ROOT_DIR}/"
  cp -f "${ROOT_DIR}/backups/v2.2/server.ts" "${ROOT_DIR}/server.ts"
  cp -f "${ROOT_DIR}/backups/v2.2/package.json" "${ROOT_DIR}/package.json"
  cp -f "${ROOT_DIR}/backups/v2.2/index.html" "${ROOT_DIR}/index.html"
  cp -f "${ROOT_DIR}/backups/v2.2/vite.config.ts" "${ROOT_DIR}/vite.config.ts"
  echo "--> Files restored successfully from backups/v2.2/."
elif git rev-parse --verify v2.2 >/dev/null 2>&1; then
  echo "--> Restoring from Git tag v2.2..."
  git checkout v2.2
  echo "--> Checked out Git tag v2.2."
else
  echo "Error: Neither backups/v2.2 directory nor Git tag v2.2 was found."
  exit 1
fi

echo "=========================================="
echo " ✅ Restore to Version 2.2 completed!"
echo "=========================================="
