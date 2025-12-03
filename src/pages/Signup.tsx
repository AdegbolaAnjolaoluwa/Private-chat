import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { signup } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await signup(values.email, values.username, values.password);
      localStorage.setItem("authToken", res.token || "demo-token");
      localStorage.setItem("authUser", JSON.stringify(res.user));
      toast.success("Account created");
      navigate("/friends");
    } catch (e: any) {
      toast.error(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">Join PrivateChat</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <div className="text-xs text-destructive">{errors.email.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="Your name" {...register("username")} />
            {errors.username && <div className="text-xs text-destructive">{errors.username.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" {...register("password")} />
            {errors.password && <div className="text-xs text-destructive">{errors.password.message}</div>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
            Already have an account? Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
