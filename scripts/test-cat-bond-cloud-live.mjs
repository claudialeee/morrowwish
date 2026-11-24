import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const base = process.env.CAT_BOND_CLOUD_URL || 'https://morrowwish.pages.dev';
const endpoint = new URL('/api/cat-bond-cloud-save', base);
const recoveryToken = randomBytes(32).toString('base64url');
assert.match(recoveryToken, /^[A-Za-z0-9_-]{43}$/);

const makePayload = (slotId, expectedRevision) => ({
  slotId,
  iv: randomBytes(12).toString('base64url'),
  ciphertext: randomBytes(32).toString('base64url'),
  expectedRevision
});
async function call(method, slotId, payload) {
  const url = new URL(endpoint);
  if (slotId) url.searchParams.set('slot', slotId);
  const response = await fetch(url, {
    method,
    headers: {
      authorization: 'Bearer ' + recoveryToken,
      ...(payload ? { 'content-type': 'application/json' } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

const first = makePayload('slot1', 0);
const put1 = await call('PUT', null, first);
assert.equal(put1.response.status, 200, 'Cloudflare must accept an encrypted slot 1 upload: ' + JSON.stringify(put1.body));
assert.equal(put1.body.revision, 1);

const second = makePayload('slot2', 0);
const put2 = await call('PUT', null, second);
assert.equal(put2.response.status, 200, 'Cloudflare must accept an independent slot 2 upload: ' + JSON.stringify(put2.body));
assert.equal(put2.body.revision, 1, 'Each slot must start its own revision counter');

const read1 = await call('GET', 'slot1');
assert.equal(read1.response.status, 200);
assert.equal(read1.body.exists, true);
assert.equal(read1.body.revision, 1);
assert.equal(read1.body.iv, first.iv);
assert.equal(read1.body.ciphertext, first.ciphertext, 'Slot 1 must round-trip the exact encrypted payload');

const read2 = await call('GET', 'slot2');
assert.equal(read2.response.status, 200);
assert.equal(read2.body.exists, true);
assert.equal(read2.body.revision, 1);
assert.equal(read2.body.iv, second.iv);
assert.equal(read2.body.ciphertext, second.ciphertext, 'Slot 2 must round-trip independently');

const stale = await call('PUT', null, { ...makePayload('slot1', 0) });
assert.equal(stale.response.status, 409, 'A stale write must be rejected rather than silently overwriting cloud progress');
assert.equal(stale.body.conflict, true);
assert.equal(stale.body.revision, 1);

console.log('Production Cloudflare D1 smoke passed: slot 1 and slot 2 independently uploaded, downloaded, and protected by per-slot revision conflicts.');
