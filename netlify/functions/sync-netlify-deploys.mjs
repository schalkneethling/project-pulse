import { createClient } from "@supabase/supabase-js";

/**
 * Netlify Function: sync-netlify-deploys
 *
 * Called from the frontend to fetch the latest deploy from the Netlify API
 * for each linked site and upsert the result into netlify_deploys.
 *
 * Expects the Supabase access token in the Authorization header so we can
 * act on behalf of the authenticated user.
 *
 * Environment variables (set in Netlify UI):
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (reads token column)
 */
export default async (request) => {
  // ── Auth ──────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Service-role client to read the API token column
  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify the user's JWT and get their uid
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // ── Read Netlify API token ────────────────────────────────
  const { data: settings } = await supabase
    .from("user_settings")
    .select("netlify_api_token")
    .eq("user_id", userId)
    .maybeSingle();

  const netlifyToken = settings?.netlify_api_token;

  if (!netlifyToken) {
    return new Response(
      JSON.stringify({ error: "No Netlify API token configured. Add one in Settings." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Fetch all linked sites for this user ──────────────────
  const { data: sites, error: sitesError } = await supabase
    .from("netlify_sites")
    .select("id, netlify_site_id, project_id")
    .eq("user_id", userId);

  if (sitesError) {
    return new Response(JSON.stringify({ error: sitesError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!sites || sites.length === 0) {
    return new Response(JSON.stringify({ synced: 0, deploys: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── For each site, fetch latest deploy from Netlify API ───
  const results = [];

  for (const site of sites) {
    if (!site.netlify_site_id) continue;

    try {
      const res = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.netlify_site_id}/deploys?per_page=1`,
        { headers: { Authorization: `Bearer ${netlifyToken}` } },
      );

      if (!res.ok) {
        results.push({ siteId: site.id, error: `Netlify API ${res.status}` });
        continue;
      }

      const deploys = await res.json();
      const d = deploys[0];

      if (!d) {
        results.push({ siteId: site.id, error: "No deploys found" });
        continue;
      }

      // Map Netlify API state to our schema states
      let state = "ready";
      if (d.state === "error" || d.state === "build_error") state = "error";
      else if (d.state === "building" || d.state === "uploading" || d.state === "processing")
        state = "building";
      else if (d.state === "enqueued" || d.state === "new") state = "enqueued";
      else if (d.state === "ready") state = "ready";

      const deployPayload = {
        netlify_site_id: site.id,
        user_id: userId,
        state,
        branch: d.branch || "main",
        commit_message: d.title || d.commit_message || null,
        deploy_time: d.deploy_time || null,
        error_message: d.error_message || null,
        published_at: d.published_at || null,
      };

      // Delete old deploys for this site, then insert the latest
      await supabase.from("netlify_deploys").delete().eq("netlify_site_id", site.id);

      const { error: insertError } = await supabase.from("netlify_deploys").insert(deployPayload);

      if (insertError) {
        results.push({ siteId: site.id, error: insertError.message });
      } else {
        results.push({ siteId: site.id, state, branch: deployPayload.branch });
      }
    } catch (err) {
      results.push({ siteId: site.id, error: err.message });
    }
  }

  return new Response(JSON.stringify({ synced: results.filter((r) => !r.error).length, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/.netlify/functions/sync-netlify-deploys",
};
