import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { getFriendRequests } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [showPrivacyAlert, setShowPrivacyAlert] = useState(true);


  const activeView = useMemo(() => {
    if (location.pathname.startsWith("/app/requests")) return "requests";
    if (location.pathname.startsWith("/app/add-friend")) return "add-friend";
    return "friends";
  }, [location.pathname]);

  useEffect(() => {
    getFriendRequests("incoming").then((reqs) => setPendingCount(reqs.length)).catch(() => setPendingCount(0));

  }, [location.pathname]);

  const onViewChange = (view: string) => {
    if (view === "friends") navigate("/app/friends");
    if (view === "requests") navigate("/app/requests");
    if (view === "add-friend") navigate("/app/add-friend");
  };

  const onLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeView={activeView} onViewChange={onViewChange} pendingRequestCount={pendingCount} onLogout={onLogout} />
        <main className="flex-1 bg-background">
          <div className="md:hidden flex items-center justify-between p-2 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="font-semibold">PrivateChat</div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
          </div>
          {showPrivacyAlert && (
            <Alert role="alert" className="m-4 border-destructive/20 bg-destructive/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-sm">
                  <strong>Auto-delete enabled:</strong> All messages automatically delete after 2 hours for privacy.
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Dismiss auto-delete notice"
                  onClick={() => setShowPrivacyAlert(false)}
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          )}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
