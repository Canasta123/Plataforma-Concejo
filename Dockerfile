# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación Astro en modo standalone
RUN npm run build

# ── Etapa 2: Producción ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copiar solo el output de producción desde la etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "./dist/server/entry.mjs"]
