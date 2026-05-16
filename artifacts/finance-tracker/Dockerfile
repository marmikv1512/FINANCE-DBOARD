FROM node:20

WORKDIR /app

RUN npm install -g pnpm serve

COPY . .

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/finance-tracker

RUN pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "serve dist -l $PORT --single"]