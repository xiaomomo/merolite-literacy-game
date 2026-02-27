FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/game.db
ENV TTS_CACHE_DIR=/app/data/tts-cache

EXPOSE 8080

VOLUME ["/app/data"]

CMD ["node", "server.js"]
