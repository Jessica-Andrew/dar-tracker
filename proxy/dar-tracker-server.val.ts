// DAR Tracker — secure Clockify proxy (ES256 / JWKS)
//
// Supabase now signs session JWTs with an ECC (ES256) private key.
// We verify incoming tokens against Supabase's published public keys
// (JWKS) rather than a shared secret.
//
// The Clockify API key never leaves this val. Only an explicit
// allowlist of operations is forwarded — everything else is rejected,
// even with a valid token, so a leaked token can't be used to make
// arbitrary changes to the Clockify account.
//
// Required environment variables:
//   CLOCKIFY_API_KEY  — the Clockify API key
//   SUPABASE_URL      — your Supabase project URL, e.g. https://xxx.supabase.co

import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5.9.6";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
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

// Every operation DAR is allowed to perform, and nothing else.
// GET is open (read-only, low risk). Writes are individually named.
type AllowedOp = {
  method: string;
  // Matches the Clockify API path this operation targets.
  pattern: RegExp;
  // Whitelists which body fields get forwarded — anything else the
  // caller sends is silently dropped rather than passed through.
  allowedBodyFields?: string[];
};

const ALLOWED_OPS: AllowedOp[] = [
  {
    method: "POST",
    // Start a timer: POST /v1/workspaces/{workspaceId}/time-entries
    pattern: /^\/v1\/workspaces\/[^/]+\/time-entries$/,
    allowedBodyFields: ["start", "description", "projectId"],
  },
  {
    method: "PATCH",
    // Stop the running timer: PATCH /v1/workspaces/{workspaceId}/user/{userId}/time-entries
    pattern: /^\/v1\/workspaces\/[^/]+\/user\/[^/]+\/time-entries$/,
    allowedBodyFields: ["end"],
  },
];

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

  // 3. Enforce the allowlist for anything that isn't a plain read.
  const url = new URL(req.url);
  let forwardBody: string | undefined;

  if (req.method !== "GET") {
    const op = ALLOWED_OPS.find(
      (o) => o.method === req.method && o.pattern.test(url.pathname),
    );
    if (!op) {
      return json(403, { error: "operation_not_allowed" });
    }

    let incoming: Record<string, unknown> = {};
    try {
      incoming = await req.json();
    } catch {
      return json(400, { error: "invalid_json_body" });
    }

    // Only forward fields we explicitly expect for this operation.
    const filtered: Record<string, unknown> = {};
    for (const field of op.allowedBodyFields ?? []) {
      if (field in incoming) filtered[field] = incoming[field];
    }
    forwardBody = JSON.stringify(filtered);
  }

  // 4. Forward to Clockify with the server-held API key
  const clockifyKey = Deno.env.get("CLOCKIFY_API_KEY");
  if (!clockifyKey) {
    return json(500, { error: "proxy_misconfigured_missing_clockify_key" });
  }

  const target = "https://api.clockify.me/api" + url.pathname + url.search;

  const resp = await fetch(target, {
    method: req.method,
    headers: {
      "X-Api-Key": clockifyKey,
      "Content-Type": "application/json",
    },
    body: forwardBody,
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