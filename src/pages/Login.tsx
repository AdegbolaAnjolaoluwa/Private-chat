import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/sonner";
import { login } from "@/lib/api";
import { ShieldCheck, Lock, Fingerprint, Key, ArrowRight, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  username: z.string().min(2, "Invalid Private ID"),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await login(values.username, values.password);
      localStorage.setItem("authToken", res.token || "demo-token");
      localStorage.setItem("authUser", JSON.stringify(res.user));
      toast.success("Welcome back");
      navigate("/app/friends");
    } catch {
      const identifier = values.username.trim().toLowerCase();
      const demos: Record<string, { id: string, username: string, email: string, password: string }> = {
        "alice@example.com": { id: "1", username: "Alice", email: "alice@example.com", password: "alice123" },
        "alice": { id: "1", username: "Alice", email: "alice@example.com", password: "alice123" },
        "bob@example.com": { id: "2", username: "Bob", email: "bob@example.com", password: "bob123" },
        "bob": { id: "2", username: "Bob", email: "bob@example.com", password: "bob123" },
      };

      const demo = demos[identifier];
      if (demo && demo.password === values.password) {
        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("authUser", JSON.stringify(demo));
        toast.success("Signed in (demo)");
        navigate("/app/friends");
      } else {
        toast.error("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--vault-bg)] text-white relative overflow-hidden">
      {/* Glow accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#135bec]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#135bec]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 text-[#135bec]">
            <svg viewBox="0 0 48 48" fill="currentColor">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.08 24 4 19.25 9.96 8.75 18.04 13.5 18.04 4h11.92v9.5l8.08-4.75L44 19.25 35.92 24 44 28.75 38.04 39.25 29.96 34.5 29.96 44H18.04v-9.5l-8.08 4.75L4 28.75 12.08 24Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Private Chat</h2>
        </div>

        <button
          type="button"
          className="h-10 px-4 rounded bg-white/5 border border-white/10 text-sm font-semibold hover:border-[#135bec] transition"
          onClick={() => navigate("/signup")}
        >
          Create Identity
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px] space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Access Private Vault
            </h1>
            <p className="text-white/50 text-lg">
              Enter your credentials to decrypt your session.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[var(--vault-charcoal)] border border-[var(--vault-border)] rounded-xl p-8 shadow-2xl space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Private ID */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Private ID
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#135bec] transition-colors">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <input
                    {...register("username")}
                    type="text"
                    placeholder="•••• •••• •••• ••••"
                    className="h-14 w-full pl-12 pr-4 rounded bg-black/40 border border-white/10 text-white placeholder-white/20 focus:ring-1 focus:ring-[#135bec] outline-none transition-all"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-400">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Access Key
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#135bec] transition-colors">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="h-14 w-full pl-12 pr-12 rounded bg-black/40 border border-white/10 text-white placeholder-white/20 focus:ring-1 focus:ring-[#135bec] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#135bec] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#135bec] hover:bg-[#135bec]/90 text-white font-bold py-4 rounded shadow-lg transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? "Decrypting..." : "Unlock Vault"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-white/20">
            <Lock className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-widest">
              End-to-end encrypted connection
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
