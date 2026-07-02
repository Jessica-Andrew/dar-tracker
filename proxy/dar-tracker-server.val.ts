// DAR Tracker — secure Clockify proxy (ES256 / JWKS)
//
// Supabase now signs session JWTs with an ECC (ES256) private key.
// We verify incoming tokens against Supabase's published public keys
// (JWKS) rather than a shared secret.
//
// The Clockify API key never leaves this val.
//
// Required environment variables:
//   CLOCKIFY_API_KEY  — the Clockify API key
//   SUPABASE_URL      — your Supabase project URL, e.g. https://xxx.supabase.co

import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// Cache the JWKS resolver so we don't refetch keys on every request.
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(supabaseUrl: string) {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(
      new URL(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`),
    );
  }
  return jwksCache;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // 1. Bearer token
  const auth = req.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return json(401, { error: "missing_bearer_token" });
  const token = match[1];

  // 2. Verify against Supabase's published public keys
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return json(500, { error: "proxy_misconfigured_missing_supabase_url" });
  }

  try {
    await jwtVerify(token, getJwks(supabaseUrl), {
      algorithms: ["ES256"],
    });
  } catch (e) {
    return json(401, {
      error: "invalid_or_expired_token",
      detail: (e as Error).message,
    });
  }

  // 3. Forward to Clockify with the server-held API key
  const clockifyKey = Deno.env.get("CLOCKIFY_API_KEY");
  if (!clockifyKey) {
    return json(500, { error: "proxy_misconfigured_missing_clockify_key" });
  }

  const url = new URL(req.url);
  const target = "https://api.clockify.me/api" + url.pathname + url.search;

  const resp = await fetch(target, {
    method: req.method,
    headers: {
      "X-Api-Key": clockifyKey,
      "Content-Type": "application/json",
    },
  });

  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}