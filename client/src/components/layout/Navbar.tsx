import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES, APP_NAME } from "../../utils/constants";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/helpers";

const links = [
  { to: ROUTES.HOME, label: "Home" },
  { to: ROUTES.PROJECTOR, label: "Projector" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-gold-500 shadow-gold" />
          <span className="font-display text-lg font-semibold tracking-widest text-ivory">
            {APP_NAME.toUpperCase()}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              target={link.to === ROUTES.PROJECTOR ? "_blank" : undefined}
              className={({ isActive }) =>
                cn(
                  "font-display text-sm tracking-wide text-ivory/70 transition-colors hover:text-gold-400",
                  isActive && "text-gold-400"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <Link to={ROUTES.ADMIN_LOGIN}>
              <Button variant="primary" size="sm">
                <Icon name="shield" className="h-3.5 w-3.5" />
                Admin login
              </Button>
            </Link>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ivory md:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5 text-gold-500" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-navy-900 md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  target={link.to === ROUTES.PROJECTOR ? "_blank" : undefined}
                  onClick={() => setOpen(false)}
                  className="font-display text-sm text-ivory/80"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="seam-divider" />
              {isAuthenticated ? (
                <div className="flex gap-3">
                  <Link to={ROUTES.DASHBOARD} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => logout()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Link to={ROUTES.ADMIN_LOGIN}>
                  <Button variant="primary" size="sm" className="w-full">
                    Admin login
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
