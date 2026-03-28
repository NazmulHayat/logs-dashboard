FROM node:20-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npx", "next", "dev", "--turbopack", "--hostname", "0.0.0.0", "--port", "3000"]
