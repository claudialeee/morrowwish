import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { socialOAuthStart, socialOAuthCode, socialRefresh, socialStore } from '../src/social-native.js';
import { authorizedSocialSchedule } from '../src/social-schedule.js';

const database = new DatabaseSync(':memory:');
const env = { DB: { prepare(sql) {
  const statement = database.prepare(sql);
  const bind = (...values) => ({
    first: async () => statement.get(...values),
    run: async () => statement.run(...values)
  });
  return { ...bind(), bind };
} } };
await socialStore(env);
let requests = 0, release;
const waiting = new Promise(resolve => { release = resolve; });
const read = async () => {
  requests++;
  await waiting;
  return [{ views: 0, likes: null }];
};
const running = socialRefresh(env, 'fixture', 900000, read);
while (!requests) await new Promise(resolve => setImmediate(resolve));
assert.equal((await socialRefresh(env, 'fixture', 900000, read)).status, 'refreshing');
release();
const initial = await running;
assert.equal(initial.status, 'ready');
assert.deepEqual(await socialRefresh(env, 'fixture', 900000, read), initial);
assert.equal(requests, 1);
database.exec("UPDATE social_native_store SET updated_at=CAST(strftime('%s','now') AS INTEGER)*1000-1800000 WHERE key LIKE 'fixture%'");
const fail = async () => { requests++; throw Error('provider unavailable'); };
const fallback = await socialRefresh(env, 'fixture', 900000, fail);
assert.equal(fallback.status, 'sync_error');
assert.deepEqual(fallback.state, initial.state);
assert.equal((await socialRefresh(env, 'fixture', 900000, fail)).status, 'sync_error');
assert.equal(requests, 2);

const connect = await socialOAuthStart(env, 'instagram', new URL('https://www.instagram.com/oauth/authorize'));
const state = new URL(connect.headers.get('location')).searchParams.get('state');
const url = 'https://morrowwish.vercel.app/api/instagram/callback?code=fixture&state=' + state;
const cookie = connect.headers.get('set-cookie');
assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
const callback = new Request(url, { headers: { Cookie: cookie.split(';')[0] } });
await assert.rejects(socialOAuthCode(new Request(url), env, 'instagram'));
await assert.rejects(socialOAuthCode(callback, env, 'tiktok'));
assert.equal(await socialOAuthCode(callback, env, 'instagram'), 'fixture');
await assert.rejects(socialOAuthCode(callback, env, 'instagram'));

const key = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', key.publicKey);
const savedFetch = globalThis.fetch;
globalThis.fetch = async url => {
  assert.equal(url, 'https://token.actions.githubusercontent.com/.well-known/jwks');
  return Response.json({ keys: [{ ...jwk, kid: 'fixture', use: 'sig' }] });
};
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const endpoint = 'https://morrowwish.pages.dev/api/social/refresh';
const claims = { iss: 'https://token.actions.githubusercontent.com', aud: endpoint,
  repository: 'claudialeee/morrowwish', repository_id: '1463817064', ref: 'refs/heads/main',
  workflow_ref: 'claudialeee/morrowwish/.github/workflows/refresh-social-native.yml@refs/heads/main',
  event_name: 'schedule', exp: now + 60, nbf: now - 10 };
async function signed(changes = {}) {
  const input = encode({ alg: 'RS256', kid: 'fixture' }) + '.' + encode({ ...claims, ...changes });
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key.privateKey, new TextEncoder().encode(input));
  return new Request(endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + input + '.' + Buffer.from(signature).toString('base64url') } });
}
try {
  assert.equal(await authorizedSocialSchedule(await signed()), true);
  for (const changes of [{ repository_id: '2' }, { event_name: 'pull_request' }, { workflow_ref: 'another' }, { aud: 'other' }, { exp: now - 1 }]) {
    assert.equal(await authorizedSocialSchedule(await signed(changes)), false);
  }
  const request = await signed();
  request.headers.set('Authorization', request.headers.get('Authorization') + 'AAA');
  assert.equal(await authorizedSocialSchedule(request), false);
} finally {
  globalThis.fetch = savedFetch;
}
console.log('Native refresh lease, null/zero, failure cache, OAuth state and GitHub OIDC verified.');
