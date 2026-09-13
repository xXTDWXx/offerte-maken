#!/usr/bin/env bash
# Publish only the generated stock file on top of the current remote main.
set -euo pipefail

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

publish_dir=$(mktemp -d)
cleanup() {
  git worktree remove --force "$publish_dir/checkout" >/dev/null 2>&1 || true
  rm -rf "$publish_dir"
}
trap cleanup EXIT

# Keep the generated file outside the checkout while syncing with newer commits.
cp spa-stock.json "$publish_dir/spa-stock.json"

for attempt in 1 2 3 4 5; do
  git fetch --no-tags origin refs/heads/main
  git worktree add --detach "$publish_dir/checkout" FETCH_HEAD
  cp "$publish_dir/spa-stock.json" "$publish_dir/checkout/spa-stock.json"
  git -C "$publish_dir/checkout" add -- spa-stock.json

  if git -C "$publish_dir/checkout" diff --cached --quiet; then
    echo "No stock changes."
    exit 0
  fi

  git -C "$publish_dir/checkout" commit -m "Update spa stock"
  if git -C "$publish_dir/checkout" push origin HEAD:refs/heads/main; then
    echo "Stock published successfully."
    exit 0
  fi

  git worktree remove --force "$publish_dir/checkout"
  if [ "$attempt" -lt 5 ]; then
    echo "Push failed; syncing with main before retry $((attempt + 1))/5."
    sleep "$attempt"
  fi
done

echo "::error::Stock could not be published after 5 attempts."
exit 1
