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

# Eliminar dependencias de desarrollo para dejar solo las de producción
RUN npm prune --omit=dev

# ── Etapa 2: Producción ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copiar el build compilado y node_modules de producción directamente desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "./dist/server/entry.mjs"]

