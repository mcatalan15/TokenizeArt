# Multi-stage: build the Vite/Tailwind frontend, then serve the static
# output straight from Caddy — one container is both the reverse proxy and
# the frontend host, so there's no third "frontend" service to run/expose.
FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY caddy/Caddyfile /etc/caddy/Caddyfile
