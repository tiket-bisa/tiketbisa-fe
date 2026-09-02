# Production CI/CD

Production builds use the `production` GitHub Environment. All `VITE_*` values are public values embedded
in the browser bundle; store them as Environment variables rather than secrets.

Required variables:

- `VITE_API_BASE_URL=https://api.tiketbisa.com`
- `VITE_API_INTERNAL_BASE_URL=https://api.tiketbisa.com`
- `VITE_GOOGLE_AUTH_CLIENT_ID`
- `VITE_MANUAL_TRANSFER_BANK_NAME`
- `VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER`
- `VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER`

Required secrets are `VM_IP`, `VM_USER`, and `SSH_PRIVATE_KEY`.
The existing `VITE_GOOGLE_AUTH_CLIENT_ID` repository secret remains a temporary compatibility source;
copy the same public client ID into the Environment variable before removing that secret.

Pull requests run unit tests, TypeScript checks, and the production build. A merge to `main` repeats the
quality gate, publishes an immutable commit-SHA image, deploys it, waits for `/healthz`, and verifies the
running container uses the expected image. The same deployment installs a version-controlled Nginx
site configuration, validates it before reload, and restores the previous Nginx file together with the
image and Compose file if verification fails.

Hashed `/assets/` responses use a one-year immutable cache. Public images, logos, and banners use a
seven-day cache with stale-while-revalidate; HTML and `/healthz` remain uncached. The frontend container
is capped at 512 MiB so it cannot starve the colocated backend, PostgreSQL, Redis, or RabbitMQ services.

The `Frontend Release E2E` workflow is a manual release gate. Supply a deployed frontend URL and its API
URL; Playwright diagnostics are retained as workflow artifacts even when the suite fails.
