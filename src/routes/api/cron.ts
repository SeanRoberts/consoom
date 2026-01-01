import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { createDb } from "../../db";
import { syncAllAccounts } from "../../server/sync";

export const Route = createFileRoute("/api/cron")({
  component: () => null,
  server: {
    handlers: {
      GET: async () => {
        const cfEnv = env as CloudflareEnv;

        if (!cfEnv?.DB) {
          return new Response(
            JSON.stringify({ error: "Database not available" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const db = createDb(cfEnv.DB);
        const results = await syncAllAccounts(db);

        return new Response(JSON.stringify({ ok: true, ...results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
