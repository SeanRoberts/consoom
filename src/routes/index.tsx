import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Redirect to login - auth check will happen there
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
