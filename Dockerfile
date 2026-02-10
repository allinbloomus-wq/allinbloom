# Используем Node.js 20 Alpine для минимального размера образа
FROM node:20-alpine AS base

# Устанавливаем необходимые зависимости для Prisma
RUN apk add --no-cache libc6-compat openssl

# Этап 1: Установка зависимостей
FROM base AS deps
WORKDIR /app

# Копируем файлы package
COPY package.json package-lock.json* ./
RUN npm ci

# Этап 2: Сборка приложения
FROM base AS builder
WORKDIR /app

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем Next.js приложение
# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Этап 3: Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Копируем собранное приложение
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копируем Prisma схему и миграции
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Копируем скрипт для запуска
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Используем entrypoint скрипт для миграций
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
