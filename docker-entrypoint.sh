#!/bin/sh
set -e

echo "🌸 Starting Flowers App..."

# Проверяем подключение к базе данных
echo "⏳ Waiting for database..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Применяем миграции
echo "🔄 Running database migrations..."
npx prisma db push --skip-generate

# Запускаем seed если это первый запуск
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

echo "🚀 Starting application..."

# Запускаем переданную команду
exec "$@"
