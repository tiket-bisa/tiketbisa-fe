#!/usr/bin/env bash
set -Eeuo pipefail

: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
: "${RELEASE_DIR:?RELEASE_DIR is required}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"

cd "$DEPLOY_DIR"
[[ -f docker-compose.yml ]] || { echo 'Existing frontend docker-compose.yml was not found' >&2; exit 1; }

backup_dir="$DEPLOY_DIR/.deploy-backups/$GITHUB_RUN_ID"
mkdir -p "$backup_dir"
cp docker-compose.yml "$backup_dir/docker-compose.yml"
sudo cp /etc/nginx/sites-available/tiketbisa.com "$backup_dir/tiketbisa.com.nginx.conf"
previous_container_id="$(docker compose ps -q tiketbisa-fe 2>/dev/null || true)"
previous_image="$(docker inspect --format='{{.Config.Image}}' "$previous_container_id" 2>/dev/null || true)"
[[ -n "$previous_image" ]] || { echo 'Could not determine the currently deployed frontend image' >&2; exit 1; }

wait_for_frontend_health() {
  local env_file="$1"
  local deadline=$((SECONDS + 150))
  local container_id

  while ((SECONDS < deadline)); do
    container_id="$(docker compose --env-file "$env_file" ps -q tiketbisa-fe 2>/dev/null || true)"
    if [[ -n "$container_id" ]] &&
       [[ "$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || true)" == healthy ]]; then
      return 0
    fi
    sleep 5
  done

  echo 'Frontend container did not become healthy within 150 seconds' >&2
  return 1
}

wait_for_rollback_health() {
  local deadline=$((SECONDS + 150))

  while ((SECONDS < deadline)); do
    if curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null 2>&1 ||
       curl --fail --silent http://127.0.0.1:3000/ >/dev/null 2>&1; then
      return 0
    fi
    sleep 5
  done

  echo 'Restored frontend did not become reachable within 150 seconds' >&2
  return 1
}

next_compose="$DEPLOY_DIR/docker-compose.yml.next"
next_env="$DEPLOY_DIR/.deploy.env.next"
cp "$RELEASE_DIR/docker-compose.yml" "$next_compose"
printf 'FRONTEND_IMAGE=%s\n' "$FRONTEND_IMAGE" > "$next_env"
docker compose --env-file "$next_env" -f "$next_compose" config >/dev/null

nginx_staged=false
sudo install -m 644 "$RELEASE_DIR/deploy/nginx/tiketbisa.com.conf" /etc/nginx/sites-available/tiketbisa.com
nginx_staged=true
if ! sudo nginx -t; then
  sudo cp "$backup_dir/tiketbisa.com.nginx.conf" /etc/nginx/sites-available/tiketbisa.com
  sudo nginx -t
  exit 1
fi

activated=false
rollback() {
  local failure_code=$?
  trap - ERR
  if [[ "$nginx_staged" == true ]]; then
    sudo cp "$backup_dir/tiketbisa.com.nginx.conf" /etc/nginx/sites-available/tiketbisa.com
    sudo nginx -t
    sudo systemctl reload nginx
  fi
  if [[ "$activated" == true ]]; then
    echo 'Frontend deployment failed; restoring the previous image and Compose file' >&2
    cp "$backup_dir/docker-compose.yml" docker-compose.yml
    printf 'FRONTEND_IMAGE=%s\n' "$previous_image" > .deploy.env
    docker compose --env-file .deploy.env up -d tiketbisa-fe
    wait_for_rollback_health
  fi
  exit "$failure_code"
}
trap rollback ERR

mv "$next_compose" docker-compose.yml
mv "$next_env" .deploy.env
activated=true

docker compose --env-file .deploy.env pull tiketbisa-fe
docker compose --env-file .deploy.env up -d --no-build tiketbisa-fe
wait_for_frontend_health .deploy.env
curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null

deployed_container_id="$(docker compose --env-file .deploy.env ps -q tiketbisa-fe)"
deployed_image="$(docker inspect --format='{{.Config.Image}}' "$deployed_container_id")"
[[ "$deployed_image" == "$FRONTEND_IMAGE" ]] || {
  printf 'Expected image %s but container uses %s\n' "$FRONTEND_IMAGE" "$deployed_image" >&2
  exit 1
}

sudo systemctl reload nginx
cache_header="$(curl --fail --silent --show-error --insecure --resolve tiketbisa.com:443:127.0.0.1 --head https://tiketbisa.com/banner/Homepage.svg | tr -d '\r' | awk -F': ' 'tolower($1) == "cache-control" {print $2}')"
[[ "$cache_header" == *'max-age=604800'* ]] || {
  printf 'Expected the public asset cache policy after Nginx reload, got: %s\n' "$cache_header" >&2
  exit 1
}

trap - ERR
echo "Frontend deployment completed with image $FRONTEND_IMAGE"
