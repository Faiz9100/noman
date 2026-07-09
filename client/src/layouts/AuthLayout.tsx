import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES, APP_NAME } from "../utils/constants";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-stadium-glow" />
      <div className="pointer-events-none absolute inset-0 bg-mesh-gold" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[length:48px_48px] opacity-40 [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link to={ROUTES.HOME} className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-gold-500 shadow-gold" />
          <span className="font-display text-lg font-semibold tracking-widest text-ivory">
            {APP_NAME.toUpperCase()}
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-strong p-8"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
