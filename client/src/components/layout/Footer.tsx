import { APP_NAME } from "../../utils/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-500" />
            <span className="font-display text-sm tracking-widest text-ivory/70">
              {APP_NAME.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-ivory/40">
            &copy; {new Date().getFullYear()} {APP_NAME}. Built for match-day auctions.
          </p>
        </div>
      </div>
    </footer>
  );
}
