# Define the version once at the top
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS development-dependencies-env
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS production-dependencies-env
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY ./package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile --prod

FROM node:${NODE_VERSION} AS build-env
RUN corepack enable && corepack prepare pnpm@latest --activate
ARG VITE_API_BASE_URL
ARG VITE_API_INTERNAL_BASE_URL
ARG VITE_GOOGLE_AUTH_CLIENT_ID
ARG VITE_MANUAL_TRANSFER_BANK_NAME
ARG VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER
ARG VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_INTERNAL_BASE_URL=$VITE_API_INTERNAL_BASE_URL
ENV VITE_GOOGLE_AUTH_CLIENT_ID=$VITE_GOOGLE_AUTH_CLIENT_ID
ENV VITE_MANUAL_TRANSFER_BANK_NAME=$VITE_MANUAL_TRANSFER_BANK_NAME
ENV VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER=$VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER
ENV VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER=$VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

FROM node:${NODE_VERSION}
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY ./package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["pnpm", "run", "start"]
