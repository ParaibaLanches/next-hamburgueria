#!/bin/sh
echo "Waiting for postgres to be ready..."
sleep 5

echo "Applying migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx tsx -r dotenv/config prisma/seeds/index.ts

echo "Starting Next.js in standalone mode..."
exec node server.js
