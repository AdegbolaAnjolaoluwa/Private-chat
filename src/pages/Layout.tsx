import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { getFriendRequests } from "@/lib/api";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const activeView = useMemo(() => {
    if (location.pathname.startsWith("/requests")) return "requests";
    if (location.pathname.startsWith("/add-friend")) return "add-friend";
    return "friends";
  }, [location.pathname]);

  useEffect(() => {
    getFriendRequests("incoming").then((reqs) => setPendingCount(reqs.length));
  }, [location.pathname]);

  const onViewChange = (view: string) => {
    if (view === "friends") navigate("/app/friends");
    if (view === "requests") navigate("/app/requests");
    if (view === "add-friend") navigate("/app/add-friend");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeView={activeView} onViewChange={onViewChange} pendingRequestCount={pendingCount} />
        <main className="flex-1 bg-background">
          <Alert className="m-4 border-primary/20 bg-primary/5">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Auto-delete enabled:</strong> All messages automatically delete after 2 hours for privacy.
            </AlertDescription>
          </Alert>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}