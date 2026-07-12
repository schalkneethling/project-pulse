import { createClient } from "@supabase/supabase-js";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function bearerToken(request) {
  return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
}

export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key ? createClient(url, key) : null;
}
