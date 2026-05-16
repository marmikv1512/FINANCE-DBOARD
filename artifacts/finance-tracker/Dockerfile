FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/finance-tracker

RUN pnpm run build

EXPOSE 4173

CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "4173"]