// The existing public GitHub repository's standard runner uses a short-lived
// OIDC token. This endpoint cannot read player data or run any publish routes.
const scheduleIssuer = "https://token.actions.githubusercontent.com";
const scheduleAudience = "https://morrowwish.pages.dev/api/social/refresh";
const scheduleRepository = "claudialeee/morrowwish";
const scheduleWorkflow = scheduleRepository + "/.github/workflows/refresh-social-native.yml@refs/heads/main";
const scheduleDecode = value => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

export async function authorizedSocialSchedule(req) {
  try {
    const bearer = req.headers.get("Authorization") ?? "";
    if (bearer.length > 8192 || !/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(bearer)) return false;
    const [header, payload, signature] = bearer.slice(7).split(".");
    const decoder = new TextDecoder();
    const { alg, kid } = JSON.parse(decoder.decode(scheduleDecode(header)));
    const claims = JSON.parse(decoder.decode(scheduleDecode(payload)));
    const now = Date.now() / 1000;
    if (alg !== "RS256" || typeof kid !== "string" || claims.iss !== scheduleIssuer ||
        claims.aud !== scheduleAudience || claims.repository !== scheduleRepository ||
        claims.repository_id !== "1463817064" || claims.ref !== "refs/heads/main" ||
        claims.workflow_ref !== scheduleWorkflow ||
        !["schedule", "workflow_dispatch"].includes(claims.event_name) ||
        !Number.isFinite(claims.exp) || !Number.isFinite(claims.nbf) ||
        claims.exp <= now || claims.nbf > now + 30) return false;

    const response = await fetch(scheduleIssuer + "/.well-known/jwks", {
      signal: AbortSignal.timeout(5000), cf: { cacheEverything: true, cacheTtl: 300 }
    });
    if (!response.ok) return false;
    const { keys } = await response.json();
    const jwk = keys.find(candidate => candidate.kid === kid && candidate.kty === "RSA" && candidate.use === "sig");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, scheduleDecode(signature), new TextEncoder().encode(header + "." + payload));
  } catch {
    return false;
  }
}
