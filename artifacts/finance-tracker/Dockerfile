FROM node:20
WORKDIR /app
RUN npm install -g pnpm serve
COPY . .
RUN pnpm install --no-frozen-lockfile
WORKDIR /app/artifacts/finance-tracker
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build
EXPOSE 3000
CMD ["sh", "-c", "serve dist/public -l $PORT --single"]