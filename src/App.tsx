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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPasswordForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/app" element={localStorage.getItem("authToken") ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Friends />} />
            <Route path="friends" element={<Friends />} />
            <Route path="requests" element={<FriendRequests />} />
            <Route path="add-friend" element={<AddFriend />} />
            <Route path="chat/:friendId" element={<Chat />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
