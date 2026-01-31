import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { requestPasswordReset } from "@/lib/api";

const schema = z.object({
  identifier: z.string().min(2, "Enter your email or username"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { token } = await requestPasswordReset(values.identifier);
      toast.success("Reset link generated");
      navigate(`/reset?token=${encodeURIComponent(token)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not generate reset link";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Forgot password</h1>
          <p className="text-sm text-muted-foreground">Enter your email or username to receive a reset link</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input id="identifier" placeholder="you@example.com or yourname" {...register("identifier")} />
            {errors.identifier && <div className="text-xs text-destructive">{errors.identifier.message}</div>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
            Back to sign in
          </Button>
        </form>
      </div>
    </div>
  );
}