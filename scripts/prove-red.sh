#!/usr/bin/env bash
# Proves the isolation specs fail when the scope is off. Exits 0 when the run failed as expected.
set -euo pipefail
cd "$(dirname "$0")/.."

LOG="$(mktemp -t tenant-scope-prove-red.XXXXXX)"

if DISABLE_TENANT_SCOPE=1 pnpm vitest run src/tenant/isolation.test.ts >"$LOG" 2>&1; then
  echo "FAIL: the suite passed without the tenant scope" >&2
  tail -30 "$LOG" >&2
  exit 1
fi

echo "ok: the suite fails without the tenant scope"
grep -E "Tests +[0-9]+ failed" "$LOG" || true
