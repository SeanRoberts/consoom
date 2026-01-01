import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { createAuth } from "../../../lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = createAuth(env as any);
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        const auth = createAuth(env as any);
        return auth.handler(request);
      },
    },
  },
});
