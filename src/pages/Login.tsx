import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { login } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await login(values.email, values.password);
      localStorage.setItem("authToken", res.token || "demo-token");
      localStorage.setItem("authUser", JSON.stringify(res.user));
      toast.success("Welcome back");
      navigate("/app/friends");
    } catch {
      const identifier = values.email.trim().toLowerCase();
      const demos: Record<string, { id: string; username: string; email: string; password: string }> = {
        "alice@example.com": { id: "1", username: "Alice", email: "alice@example.com", password: "alice123" },
        "alice": { id: "1", username: "Alice", email: "alice@example.com", password: "alice123" },
        "bob@example.com": { id: "2", username: "Bob", email: "bob@example.com", password: "bob123" },
        "bob": { id: "2", username: "Bob", email: "bob@example.com", password: "bob123" },
      };
      const demo = demos[identifier];
      if (demo && demo.password === values.password) {
        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("authUser", JSON.stringify({ id: demo.id, username: demo.username, email: demo.email }));
        toast.success("Signed in (demo)");
        navigate("/app/friends");
      } else {
        toast.error("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sign in to PrivateChat</h1>
          <p className="text-sm text-muted-foreground">Secure messaging with auto-delete</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <div className="text-xs text-destructive">{errors.email.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" {...register("password")} />
            {errors.password && <div className="text-xs text-destructive">{errors.password.message}</div>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/signup")}>
            Create an account
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/forgot")}>
            Forgot password?
          </Button>
        </form>
      </div>
    </div>
  );
}
