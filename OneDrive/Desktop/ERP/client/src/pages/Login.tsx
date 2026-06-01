import { Boxes, ClipboardList, KeyRound, LogIn, Moon, ShieldCheck, Sparkles, Sun, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { APP_NAME, APP_TAGLINE } from "../constants/branding";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../constants/adminCredentials";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Badge, Button, Card, Field, inputClass } from "../components/ui";

type Mode = "login" | "signup" | "forgot" | "otp";

export function Login() {
  const { token, login, signup, forgotPassword, verifyOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD, otp: "" });

  if (token) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (mode === "login") await login(form.email, form.password);
      if (mode === "signup") await signup(form.name, form.email, form.password);
      if (mode === "forgot") {
        await forgotPassword(form.email);
        setMode("otp");
      }
      if (mode === "otp") await verifyOtp(form.email, form.otp, form.password);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Authentication failed");
    }
  }

  function fillAdmin() {
    setForm((f) => ({ ...f, email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }));
    toast.success("Admin credentials filled");
  }

  async function copyCreds() {
    await navigator.clipboard.writeText(`${DEMO_ADMIN_EMAIL}\n${DEMO_ADMIN_PASSWORD}`);
    toast.success("Copied to clipboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-xl border border-line bg-panel/90 text-cream shadow-soft"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 pb-8 sm:py-10 lg:grid lg:min-h-0 lg:grid-cols-[1.1fr_440px] lg:items-center lg:gap-8 lg:px-8">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 lg:hidden">
          <Badge tone="accent">
            <ShieldCheck size={12} className="mr-1 inline" /> {APP_NAME}
          </Badge>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-cream">Restaurant · hotel · retail POS</h1>
          <p className="mt-2 text-sm text-muted">Inventory, checkout, procurement, and analytics — built for multi-venue operators.</p>
        </section>

        <section className="hidden flex-col justify-between lg:flex">
          <div>
            <Badge tone="accent">
              <ShieldCheck size={12} className="mr-1 inline" /> Enterprise-grade security
            </Badge>
            <h1 className="mt-8 max-w-xl font-display text-5xl font-bold leading-[1.1] tracking-tight text-cream">
              Run every venue like a flagship property.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              {APP_NAME} delivers Toast-class POS speed with enterprise inventory, purchase orders, and real-time command
              center analytics for restaurants, hotels, malls, and retail chains.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { stat: "99.9%", label: "Uptime SLA" },
              { stat: "256-bit", label: "Encrypted sessions" },
              { stat: "RBAC", label: "Role-based access" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur">
                <p className="text-2xl font-bold text-gold">{item.stat}</p>
                <p className="mt-2 text-xs text-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 flex items-center gap-2 text-sm text-cream/40">
            <Boxes size={16} /> Trusted by enterprise operations worldwide
          </p>
        </section>

        <div className="w-full">
          <Card className="border-white/[0.08] shadow-panel">
            <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-navy shadow-glow sm:h-14 sm:w-14">
                <Sparkles size={24} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-cream sm:text-2xl">{APP_NAME}</h2>
                <p className="text-xs text-muted sm:text-sm">{APP_TAGLINE} · {mode === "login" ? "Sign in" : mode === "signup" ? "Register" : "Recovery"}</p>
              </div>
            </div>

            {mode === "login" && (
              <div className="mb-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gold">Default administrator</p>
                <div className="mt-3 space-y-1 font-mono text-sm text-cream">
                  <p>
                    <span className="text-muted">Email:</span> {DEMO_ADMIN_EMAIL}
                  </p>
                  <p>
                    <span className="text-muted">Password:</span> {DEMO_ADMIN_PASSWORD}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={fillAdmin}>
                    Use admin login
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="w-full" onClick={copyCreds}>
                    <ClipboardList size={14} /> Copy
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <Field label="Full name">
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </Field>
              )}
              <Field label="Work email">
                <input
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  autoComplete="email"
                  required
                />
              </Field>
              {mode !== "forgot" && (
                <Field label={mode === "otp" ? "New password" : "Password"}>
                  <input
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                </Field>
              )}
              {mode === "otp" && (
                <Field label="Verification code">
                  <input className={inputClass} value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} maxLength={6} required />
                </Field>
              )}
              <Button className="w-full" size="lg" type="submit">
                {mode === "login" && <LogIn size={18} />}
                {mode === "signup" && <UserPlus size={18} />}
                {(mode === "forgot" || mode === "otp") && <KeyRound size={18} />}
                {mode === "login" ? "Sign in to workspace" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send OTP" : "Verify & continue"}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-sm">
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-left font-medium text-gold hover:underline">
                {mode === "login" ? "Need another account? Register" : "Already have access? Sign in"}
              </button>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="text-left text-muted hover:text-cream">
                  Forgot password
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
