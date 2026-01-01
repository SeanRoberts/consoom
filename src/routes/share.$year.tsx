import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/share/$year")({
  component: ShareLayout,
});

function ShareLayout() {
  return (
    <div className="min-h-screen bg-card p-8">
      <div className="max-w-md mx-auto">
        <Outlet />
        <p className="text-xs text-muted-foreground mt-8 text-center">consoom.app</p>
      </div>
    </div>
  );
}
