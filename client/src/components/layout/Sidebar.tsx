import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ROUTES, APP_NAME } from "../../utils/constants";
import { cn } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { getInitials } from "../../utils/helpers";
import { Icon, IconName } from "../common/Icon";

const navItems: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: ROUTES.DASHBOARD, label: "Overview", icon: "grid", end: true },
  { to: ROUTES.LIVE_AUCTION, label: "Live Auction", icon: "bolt" },
  { to: ROUTES.TEAMS, label: "Teams", icon: "shield" },
  { to: ROUTES.PLAYERS, label: "Players", icon: "user" },
  { to: ROUTES.AUCTION_HISTORY, label: "Auction History", icon: "history" },
  { to: ROUTES.SETTINGS, label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/5 bg-navy-950 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
        <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-gold-500 shadow-gold" />
        <span className="font-display text-base font-semibold tracking-widest text-ivory">
          {APP_NAME.toUpperCase()}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm tracking-wide transition-colors",
                isActive ? "text-gold-400" : "text-ivory/60 hover:bg-white/5 hover:text-ivory"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-gold-500/10 ring-1 ring-inset ring-gold-500/25"
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <a
          href={ROUTES.PROJECTOR}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-lg border border-gold-500/25 bg-gradient-to-br from-gold-500/10 to-transparent px-3 py-2.5 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-500/15"
        >
          <span className="flex items-center gap-2.5">
            <Icon name="tv" className="h-4 w-4" />
            Projector Screen
          </span>
          <Icon name="external-link" className="h-3.5 w-3.5 opacity-60" />
        </a>
      </div>

      {user && (
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/20 font-display text-sm text-gold-400">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ivory">{user.name}</p>
              <p className="truncate text-xs capitalize text-ivory/50">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
