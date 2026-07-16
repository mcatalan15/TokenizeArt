# Runs the Fastify API straight from TypeScript via tsx — same choice as
# mint/ipfs/upload.ts in the mandatory part, no separate build step needed.
FROM node:20-slim
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
