# ---- Etapa 1: compilación y generación de Prisma ----
FROM node:20-alpine AS builder
WORKDIR /app

# Se copian primero las dependencias y el esquema de Prisma para aprovechar
# la caché de Docker: npm ci solo se vuelve a ejecutar si estos archivos cambian.
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

# ---- Etapa 2: ejecución de la aplicación ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
