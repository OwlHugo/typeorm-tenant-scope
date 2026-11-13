#!/usr/bin/env bash
# Removes the container and its volume.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose down -v
echo "postgres removed"
