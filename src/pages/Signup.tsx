import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/sonner";
import { signup } from "@/lib/api";
import { Eye, EyeOff, Shield, ArrowRight } from "lucide-react";

const schema = z.object({
  username: z.string().min(2, "Private ID must be at least 2 characters"),
  password: z.string().min(6, "Access Key must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function Signup() {
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
      const privateEmail = `${values.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}.${Date.now()}@private.chat`;

      const res = await signup(privateEmail, values.username, values.password);

      localStorage.setItem("authToken", res.token || "demo-token");
      localStorage.setItem("authUser", JSON.stringify(res.user));

      toast.success("Private identity created");
      navigate("/manifesto");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create identity";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-[#135bec]/20 blur-[160px]" />
      <div className="absolute -bottom-40 -right-40 w-[360px] h-[360px] bg-[#135bec]/10 blur-[140px]" />

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 font-semibold">
          <div className="w-6 h-6 text-[#135bec]">✳</div>
          <span>Private Chat</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 text-sm font-semibold rounded bg-white/5 border border-white/10 hover:border-[#135bec] transition"
        >
          Import Identity
        </button>
      </header>

      {/* Main */}
      <main className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-[420px] text-center space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Create Private Identity</h1>
            <p className="text-white/50">
              Your entry into a zero-trace communication space.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#0b0f1a] border border-white/10 rounded-xl p-6 text-left space-y-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Private ID */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Chosen Handle
                </label>
                <input
                  {...register("username")}
                  placeholder="What should your inner circle call you?"
                  className="w-full h-12 px-4 rounded bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#135bec]"
                />
                {errors.username && (
                  <p className="text-xs text-red-400">
                    {errors.username.message}
                  </p>
                )}
                <p className="text-xs text-white/40">
                  This is only visible to people you choose to connect with.
                </p>
              </div>

              {/* Access Key */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-white/60">
                  Access Key
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Your private password (cannot be recovered)"
                    className="w-full h-12 px-4 pr-12 rounded bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#135bec]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#135bec]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* No-data policy */}
              <div className="border border-dashed border-white/10 rounded p-4 bg-black/30 space-y-2">
                <div className="flex items-center gap-2 text-[#135bec]">
                  <Shield size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    No-Data Policy
                  </span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  We do not collect emails, phone numbers, or IP addresses.
                  If you lose your <b>Access Key</b>, your account is gone forever.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#135bec] hover:bg-[#135bec]/90 text-white font-semibold py-3 rounded transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Creating…" : "Generate My Private Identity"}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/40">
            By continuing, you acknowledge that messages disappear after 2 hours.
          </p>
        </div>
      </main>
    </div>
  );
}
