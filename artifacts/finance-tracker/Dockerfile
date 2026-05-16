FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/finance-tracker

RUN pnpm run build

EXPOSE 4173

CMD ["sh", "-c", "pnpm run preview --host 0.0.0.0 --port $PORT"]