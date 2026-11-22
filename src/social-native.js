// D1 coordinates refreshes across Cloudflare isolates. Only successful provider
// responses replace the last reading, and a failed attempt has its own cooldown.
export const SOCIAL_EXPECTED_POSTS = 7;
export const socialCount = value =>
  (typeof value === "number" || typeof value === "string" && /^\d+$/.test(value)) &&
  Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export async function socialStore(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_store (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
}
export async function socialRead(env, key) {
  const row = await env.DB.prepare("SELECT payload,updated_at FROM social_native_store WHERE key=?").bind(key).first();
  return row ? { data: JSON.parse(row.payload), updatedAt: row.updated_at } : null;
}
export async function socialWrite(env, key, data) {
  await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
    .bind(key, JSON.stringify(data), Date.now()).run();
}

export class SocialSyncError extends Error {
  constructor(status) {
    super(status);
    this.status = status;
  }
}

export async function socialRefresh(env, key, ttl, fetchPosts, force = false) {
  const saved = await socialRead(env, key);
  const now = Date.now();
  const cached = saved && now - saved.updatedAt < 29 * 86400000 ? saved : null;
  const lock = key + ":refresh";
  if (!force && cached && now - cached.updatedAt < ttl) {
    const attempt = await socialRead(env, lock);
    const status = attempt?.updatedAt > now ? attempt.data.status : "ready";
    return { state: cached.data, status };
  }
  const claim = crypto.randomUUID();
  // Provider requests have bounded timeouts. The lease also bounds duplicate
  // force-refresh calls while an attempt is still running.
  const lease = { claim, status: "refreshing" };
  const acquired = await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at WHERE social_native_store.updated_at<=? RETURNING key")
    .bind(lock, JSON.stringify(lease), now + 120000, now).first();
  if (!acquired) {
    const attempt = await socialRead(env, lock);
    const latest = await socialRead(env, key);
    return { state: (latest && now - latest.updatedAt < 29 * 86400000 ? latest.data : null) ?? cached?.data ?? null, status: attempt?.data.status ?? "refreshing" };
  }
  let status = "ready";
  let state = cached?.data ?? null;
  try {
    const posts = await fetchPosts(env);
    const reading = { posts, checkedAt: new Date().toISOString() };
    await socialWrite(env, key, reading);
    state = reading;
  } catch (error) {
    status = error instanceof SocialSyncError ? error.status : "sync_error";
    console.warn("Social native refresh failed", key, status);
  } finally {
    const cooldown = status === "ready" ? 30000 : 5 * 60000;
    await env.DB.prepare("UPDATE social_native_store SET payload=?,updated_at=? WHERE key=? AND payload=?")
      .bind(JSON.stringify({ status }), Date.now() + cooldown, lock, JSON.stringify(lease)).run();
  }
  return { state, status };
}

export function socialOverlay(base, state, status, { id, name, source, metrics, isApproved }) {
  const result = structuredClone(base ?? {});
  const readings = new Map((state?.posts ?? []).filter(isApproved).map(post => [post.game, post]));
  const complete = readings.size === SOCIAL_EXPECTED_POSTS;
  const primary = id === "bluesky" ? ["likes", "reposts", "replies", "quotes"] : ["views", "likes", "comments"];
  result[name] = {
    status: status === "ready" && (!complete || [...readings.values()].some(post => primary.some(metric => socialCount(post[metric]) === null)))
      ? "partial" : status,
    source,
    checkedAt: state?.checkedAt ?? null,
    postMetricsCount: readings.size,
    expectedPosts: SOCIAL_EXPECTED_POSTS
  };
  const row = result.platforms?.find(platform => platform.id === id);
  if (row) {
    for (const metric of new Set(["views", ...metrics])) {
      row[metric] = complete && metrics.includes(metric) && [...readings.values()].every(post => socialCount(post[metric]) !== null)
        ? [...readings.values()].reduce((sum, post) => sum + socialCount(post[metric]), 0) : null;
    }
  }
  if (result.metricScope) {
    result.metricScope.verifiedPosts = (result.metricScope.verifiedPosts ?? []).filter(post => post.platform !== id || isApproved(post))
      .map(post => {
        if (post.platform !== id) return post;
        const reading = readings.get(post.game);
        return {
          platform: id, game: post.game, url: post.url, publishedAt: post.publishedAt,
          approved: true, publicVerified: true, checkedAt: reading ? state.checkedAt : null,
          dataSource: reading ? source : null,
          ...Object.fromEntries([...new Set(["views", ...metrics])].map(metric => [metric, socialCount(reading?.[metric])]))
        };
      });
    result.metricScope.activeApprovedPosts = result.metricScope.verifiedPosts.length;
  }
  return result;
}

export async function socialOAuthStart(env, platform, url) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_oauth (state TEXT PRIMARY KEY, created_at INTEGER NOT NULL)").run();
  const state = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO social_native_oauth(state,created_at) VALUES(?,?)").bind(platform + ":" + state, Date.now()).run();
  await env.DB.prepare("DELETE FROM social_native_oauth WHERE created_at<?").bind(Date.now() - 600000).run();
  url.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: {
    Location: url.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "Set-Cookie": socialOAuthCookie(platform) + "=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600"
  } });
}

function socialOAuthCookie(platform) {
  return "__Host-morrowwish-" + platform + "-oauth";
}

export async function socialOAuthCode(req, env, platform) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") ?? "";
  const code = searchParams.get("code");
  const expected = socialOAuthCookie(platform) + "=" + state;
  if (!/^[0-9a-f-]{36}$/.test(state) || !(req.headers.get("Cookie") ?? "").split(/;\s*/).includes(expected)) {
    throw new SocialSyncError("invalid_oauth_state");
  }
  const used = await env.DB.prepare("DELETE FROM social_native_oauth WHERE state=? AND created_at>? RETURNING state")
    .bind(platform + ":" + state, Date.now() - 600000).first();
  if (!used || !code || code.length > 2048) throw new SocialSyncError("invalid_oauth_response");
  return code;
}

export function socialOAuthResult(platform, connected) {
  return new Response(null, { status: 302, headers: {
    Location: "https://morrowwish.vercel.app/studio-insights/?" + platform + "=" + (connected ? "connected" : "error"),
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "Set-Cookie": socialOAuthCookie(platform) + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  } });
}

export function socialRefreshResponse(json, native) {
  const ok = ["ready", "partial"].includes(native.status);
  return json({ ok, ...native }, ok ? 200 : native.status === "refreshing" ? 202 : 502);
}
