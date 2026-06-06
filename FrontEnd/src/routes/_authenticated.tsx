import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DecipherSidebar } from "@/components/decipher/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Landing } from "@/components/decipher/landing";
import { LimitReachedDialog } from "@/components/decipher/limit-reached-dialog";

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  ),
});

function AppLayout() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return (
      <>
        <Landing />
        <Toaster theme="dark" />
      </>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {user && <DecipherSidebar />}
      <main className="flex-1 min-w-0 flex flex-col bg-background/40">
        {user ? <Outlet /> : <div className="flex-1" />}
      </main>
      <Toaster theme="dark" />
      <LimitReachedDialog />
    </div>
  );
}
