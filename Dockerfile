FROM node:22-slim
WORKDIR /app


RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV DB_PATH=/app/data/app.db
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/server.js"]