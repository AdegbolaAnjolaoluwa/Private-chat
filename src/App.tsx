import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./pages/Layout";
import Friends from "./pages/Friends";
import FriendRequests from "./pages/FriendRequests";
import AddFriend from "./pages/AddFriend";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Manifesto from "./pages/Manifesto";
import IdentityReady from "./pages/IdentityReady";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPasswordForm";
import NotFound from "./pages/NotFound";
import SplashScreen from "@/components/SplashScreen";
import ConnectionLost from "@/components/ConnectionLost";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && <ConnectionLost />}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/manifesto" element={<Manifesto />} />
              <Route path="/identity-ready" element={<IdentityReady />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route index element={<Friends />} />
                <Route path="friends" element={<Friends />} />
                <Route path="requests" element={<FriendRequests />} />
                <Route path="add-friend" element={<AddFriend />} />
                <Route path="settings" element={<Settings />} />
                <Route path="chat/:friendId" element={<Chat />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
