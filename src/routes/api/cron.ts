import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createDb } from "../../db";
import { syncAllAccounts } from "../../server/sync";

export const APIRoute = createAPIFileRoute("/api/cron")({
  GET: async ({ request }) => {
    const env = (request as any).cf?.env as CloudflareEnv;

    if (!env?.DB) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = createDb(env.DB);
    const results = await syncAllAccounts(db);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
