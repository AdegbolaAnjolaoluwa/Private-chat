import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { resetPassword } from "@/lib/api";
import { Copy, Check } from "lucide-react";

const schema = z
  .object({
    identifier: z.string().min(2, "Enter your email or username"),
    recoveryKey: z.string().min(1, "Enter your recovery key"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", recoveryKey: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await resetPassword(values.identifier, values.recoveryKey, values.newPassword);
      setNewRecoveryKey(res.recoveryKey);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Reset failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newRecoveryKey || "");
    setCopied(true);
    toast.success("Recovery key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (newRecoveryKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Password reset</h1>
          <p className="text-sm text-muted-foreground">
            Your old recovery key is no longer valid. Save this new one — it will not be shown again.
          </p>
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 p-3">
            <span className="font-mono text-sm break-all">{newRecoveryKey}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Copy recovery key"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Continue to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">Enter your identity and recovery key to set a new password</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input id="identifier" placeholder="you@example.com or yourname" {...register("identifier")} />
            {errors.identifier && <div className="text-xs text-destructive">{errors.identifier.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="recoveryKey">Recovery Key</Label>
            <Input id="recoveryKey" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" {...register("recoveryKey")} />
            {errors.recoveryKey && <div className="text-xs text-destructive">{errors.recoveryKey.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} />
            {errors.newPassword && <div className="text-xs text-destructive">{errors.newPassword.message}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <div className="text-xs text-destructive">{errors.confirmPassword.message}</div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
            Back to sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
