import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { Avatar } from "../common/Avatar";
import { ROUTES } from "../../utils/constants";

const TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]: "Overview",
  [ROUTES.LIVE_AUCTION]: "Live Auction",
  [ROUTES.TEAMS]: "Teams",
  [ROUTES.PLAYERS]: "Players",
  [ROUTES.AUCTION_HISTORY]: "Auction History",
  [ROUTES.SETTINGS]: "Settings",
};

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? "Match Day Control Room";

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-navy-900/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ivory lg:hidden"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <p className="eyebrow hidden sm:block">{title}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Search"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-ivory/50 transition-colors hover:bg-white/5 hover:text-ivory sm:flex"
        >
          <Icon name="search" className="h-4 w-4" />
        </button>
        <button
          aria-label="Notifications"
          className="relative hidden h-9 w-9 items-center justify-center rounded-lg text-ivory/50 transition-colors hover:bg-white/5 hover:text-ivory sm:flex"
        >
          <Icon name="bell" className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-500" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

        {user && <Avatar name={user.name} size="sm" className="hidden sm:flex" />}
        <span className="hidden text-sm text-ivory/60 md:inline">{user?.name}</span>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <Icon name="logout" className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
