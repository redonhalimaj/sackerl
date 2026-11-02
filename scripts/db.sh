#!/usr/bin/env bash
# Thin wrapper around the Supabase CLI for the remote dev project.
# Reads DATABASE_URL from the ignored root .env; never prints it.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
: "${DATABASE_URL:?DATABASE_URL missing in .env}"
case "${1:-}" in
  status) supabase migration list --db-url "$DATABASE_URL" ;;
  plan)   supabase db push --dry-run --db-url "$DATABASE_URL" ;;
  push)   supabase db push --db-url "$DATABASE_URL" ;;
  new)    shift; supabase migration new "$@" ;;
  *) echo "usage: scripts/db.sh status|plan|push|new <name>"; exit 2 ;;
esac
