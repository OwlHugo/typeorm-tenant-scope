#!/usr/bin/env bash
# Disposable Postgres for the specs. Blocks until the healthcheck passes.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d --wait
echo "postgres ready on 127.0.0.1:55433"
