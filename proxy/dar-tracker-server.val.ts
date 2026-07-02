// DAR Tracker — secure Clockify proxy
//
// Verifies incoming requests carry a valid Supabase session JWT, then
// forwards them to the Clockify API with the API key attached server-side.
//
// The Clockify key never leaves this val. The frontend never sees it.
//
// Required environment variables (set in Val.town → val → Env vars):
//   CLOCKIFY_API_KEY     — the Clockify API key
//   SUPABASE_JWT_SECRET  — Supabase → Project Settings → API → JWT Secret

import { jwtVerify } from "https://esm.sh/jose@5.9.6";

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

export default async function (req: Request): Promise<Response> {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // 1. Extract bearer token
  const auth = req.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return json(401, { error: "missing_bearer_token" });
  }
  const token = match[1];

  // 2. Verify JWT against Supabase's shared secret.
  //    Supabase issues HS256-signed tokens; verifying with the JWT secret
  //    proves the request came from a signed-in Supabase user.
  const secret = Deno.env.get("SUPABASE_JWT_SECRET");
  if (!secret) {
    return json(500, { error: "proxy_misconfigured_missing_jwt_secret" });
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
  } catch {
    return json(401, { error: "invalid_or_expired_token" });
  }

  // 3. Forward to Clockify with the server-held API key.
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
