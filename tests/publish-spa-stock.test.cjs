const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const publisher = path.resolve(__dirname, '../scripts/publish-spa-stock.sh');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stock-publish-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, 'remote.git');
  const editor = path.join(root, 'editor');
  const runner = path.join(root, 'runner');
  git(root, 'init', '--bare', '--initial-branch=main', remote);
  git(root, 'clone', remote, editor);
  git(editor, 'config', 'user.name', 'Test');
  git(editor, 'config', 'user.email', 'test@example.test');
  fs.writeFileSync(path.join(editor, 'spa-stock.json'), '{"version":1}\n');
  fs.writeFileSync(path.join(editor, 'kassa.html'), 'Original application\n');
  git(editor, 'add', '.');
  git(editor, 'commit', '-m', 'Initial');
  git(editor, 'push', 'origin', 'main');
  git(root, 'clone', remote, runner);
  return { root, remote, editor, runner };
}
function publish(runner) {
  return spawnSync('bash', [publisher], { cwd: runner, encoding: 'utf8' });
}
function latest(remote, file) { return git(remote, 'show', `main:${file}`); }

test('stale checkout publishes stock while preserving newer application commits', t => {
  const { remote, editor, runner } = fixture(t);
  fs.writeFileSync(path.join(editor, 'kassa.html'), 'New PV overview\n');
  git(editor, 'commit', '-am', 'Add PV');
  git(editor, 'push', 'origin', 'main');
  const parent = git(remote, 'rev-parse', 'main');
  fs.writeFileSync(path.join(runner, 'spa-stock.json'), '{"version":2}\n');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(latest(remote, 'spa-stock.json'), '{"version":2}');
  assert.equal(latest(remote, 'kassa.html'), 'New PV overview');
  assert.equal(git(remote, 'rev-parse', 'main^'), parent);
  assert.equal(git(remote, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'main'), 'spa-stock.json');
});

test('concurrent main update retries safely and includes only generated stock', t => {
  const { remote, editor, runner } = fixture(t);
  fs.writeFileSync(path.join(editor, 'kassa.html'), 'Concurrent application change\n');
  fs.writeFileSync(path.join(editor, 'spa-stock.json'), '{"version":"other-update"}\n');
  git(editor, 'commit', '-am', 'Concurrent update');
  const concurrent = git(editor, 'rev-parse', 'HEAD');
  git(editor, 'push', 'origin', 'HEAD:refs/heads/concurrent');
  // Simulate another push immediately before our first push reaches the server.
  const hook = path.join(runner, '.git/hooks/pre-push');
  fs.writeFileSync(hook, '#!/bin/sh\nif [ ! -f .git/raced ]; then\n  touch .git/raced\n  git --git-dir="' + remote + '" update-ref refs/heads/main ' + concurrent + '\nfi\n');
  fs.chmodSync(hook, 0o755);
  // Worktree hook cwd differs; use the shared git directory for the marker.
  fs.writeFileSync(hook, fs.readFileSync(hook, 'utf8').replaceAll('.git/raced', path.join(runner, '.git/raced')));
  fs.writeFileSync(path.join(runner, 'spa-stock.json'), '{"version":2}\n');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /retry 2\/5/);
  assert.equal(latest(remote, 'spa-stock.json'), '{"version":2}');
  assert.equal(latest(remote, 'kassa.html'), 'Concurrent application change');
  assert.equal(git(remote, 'rev-parse', 'main^'), concurrent);
});

test('unchanged stock creates no commit', t => {
  const { remote, runner } = fixture(t);
  const before = git(remote, 'rev-parse', 'main');
  const result = publish(runner);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No stock changes/);
  assert.equal(git(remote, 'rev-parse', 'main'), before);
});

test('persistent rejection fails clearly without changing remote data', t => {
  const { remote, runner } = fixture(t);
  const hook = path.join(remote, 'hooks/pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(hook, 0o755);
  fs.writeFileSync(path.join(runner, 'spa-stock.json'), '{"version":2}\n');
  const result = publish(runner);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /could not be published after 5 attempts/);
  assert.equal(latest(remote, 'spa-stock.json'), '{"version":1}');
  assert.equal(git(runner, 'worktree', 'list', '--porcelain').match(/^worktree /gm).length, 1);
});
