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
previous_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe 2>/dev/null || true)"
[[ -n "$previous_image" ]] || { echo 'Could not determine the currently deployed frontend image' >&2; exit 1; }

next_compose="$DEPLOY_DIR/docker-compose.yml.next"
next_env="$DEPLOY_DIR/.deploy.env.next"
cp "$RELEASE_DIR/docker-compose.yml" "$next_compose"
printf 'FRONTEND_IMAGE=%s\n' "$FRONTEND_IMAGE" > "$next_env"
docker compose --env-file "$next_env" -f "$next_compose" config >/dev/null

activated=false
rollback() {
  local failure_code=$?
  trap - ERR
  if [[ "$activated" == true ]]; then
    echo 'Frontend deployment failed; restoring the previous image and Compose file' >&2
    cp "$backup_dir/docker-compose.yml" docker-compose.yml
    printf 'FRONTEND_IMAGE=%s\n' "$previous_image" > .deploy.env
    docker compose --env-file .deploy.env up -d tiketbisa-fe
    timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
    curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null
  fi
  exit "$failure_code"
}
trap rollback ERR

mv "$next_compose" docker-compose.yml
mv "$next_env" .deploy.env
activated=true

docker compose --env-file .deploy.env pull tiketbisa-fe
docker compose --env-file .deploy.env up -d --no-build tiketbisa-fe
timeout 150 bash -c 'until [[ "$(docker inspect --format="{{.State.Health.Status}}" tiketbisa-fe 2>/dev/null)" == healthy ]]; do sleep 5; done'
curl --fail --silent http://127.0.0.1:3000/healthz >/dev/null

deployed_image="$(docker inspect --format='{{.Config.Image}}' tiketbisa-fe)"
[[ "$deployed_image" == "$FRONTEND_IMAGE" ]] || {
  printf 'Expected image %s but container uses %s\n' "$FRONTEND_IMAGE" "$deployed_image" >&2
  exit 1
}

trap - ERR
echo "Frontend deployment completed with image $FRONTEND_IMAGE"
