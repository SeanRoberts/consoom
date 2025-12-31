import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createAuth } from "../../../lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    const env = (request as any).cf?.env;
    const auth = createAuth(env);
    return auth.handler(request);
  },
  POST: async ({ request }) => {
    const env = (request as any).cf?.env;
    const auth = createAuth(env);
    return auth.handler(request);
  },
});
