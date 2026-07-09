import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ROUTES, APP_NAME } from "../../utils/constants";
import { cn } from "../../utils/helpers";
import { Icon, IconName } from "../common/Icon";

const navItems: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: ROUTES.DASHBOARD, label: "Overview", icon: "grid", end: true },
  { to: ROUTES.LIVE_AUCTION, label: "Live Auction", icon: "bolt" },
  { to: ROUTES.TEAMS, label: "Teams", icon: "shield" },
  { to: ROUTES.PLAYERS, label: "Players", icon: "user" },
  { to: ROUTES.AUCTION_HISTORY, label: "Auction History", icon: "history" },
  { to: ROUTES.SETTINGS, label: "Settings", icon: "settings" },
];

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: "tween", duration: 0.25 }}
      className="flex h-full w-72 flex-col border-r border-white/5 bg-navy-950 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-floodlight rounded-full bg-gold-500 shadow-gold" />
          <span className="font-display text-base font-semibold tracking-widest text-ivory">
            {APP_NAME.toUpperCase()}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="text-ivory/50 hover:text-ivory">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-display text-sm tracking-wide text-ivory/60",
                isActive && "bg-gold-500/10 text-gold-400"
              )
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <a
        href={ROUTES.PROJECTOR}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-3 py-2.5 text-sm font-medium text-gold-400"
      >
        <Icon name="tv" className="h-4 w-4" />
        Projector Screen
      </a>
    </motion.div>
  );
}
