import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createAuth } from "../lib/auth";

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const cfEnv = env as CloudflareEnv & {
    BETTER_AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  const auth = createAuth(cfEnv);
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session?.user) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
