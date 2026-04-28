#!/bin/sh
set -e

echo "Waiting for database..."
i=0
until npx --yes prisma db push --skip-generate; do
  i=$((i+1))
  if [ $i -ge 30 ]; then
    echo "DB never became ready after 30 attempts. Last error shown above."
    exit 1
  fi
  echo "  retry $i/30..."
  sleep 2
done

if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts || echo "Seed failed (continuing)."
fi

echo "Starting Next.js..."
exec node server.js
