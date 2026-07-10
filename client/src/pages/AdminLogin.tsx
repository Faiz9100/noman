import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || ROUTES.DASHBOARD;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/25 to-amber-500/5 ring-1 ring-gold-500/30">
        <Icon name="shield" className="h-6 w-6 text-gold-400" />
      </div>

      <h1 className="mb-1 text-center text-2xl font-semibold text-ivory">Admin Login</h1>
      <p className="mb-8 text-center text-sm text-ivory/50">
        Restricted access — the control room for tonight's auction.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ivory/50">
            Email address
          </label>
          <div className="relative">
            <Icon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@auctionnight.com"
              className="w-full rounded-lg border border-white/10 bg-navy-900 py-2.5 pl-10 pr-4 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ivory/50">
            Password
          </label>
          <div className="relative">
            <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-navy-900 py-2.5 pl-10 pr-10 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-ivory/60"
            >
              <Icon name={showPassword ? "eye-off" : "eye"} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign in to control room
        </Button>
      </form>
    </div>
  );
}
