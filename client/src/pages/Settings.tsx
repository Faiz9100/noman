import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Icon, IconName } from "../components/common/Icon";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import { cn } from "../utils/helpers";

type TabId = "general" | "rules" | "purse" | "appearance" | "account";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "general", label: "General", icon: "settings" },
  { id: "rules", label: "Auction Rules", icon: "gavel" },
  { id: "purse", label: "Teams & Purse", icon: "wallet" },
  { id: "appearance", label: "Appearance", icon: "sparkles" },
  { id: "account", label: "Admin Account", icon: "lock" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-gold-500" : "bg-white/10"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-navy-950 shadow",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-ivory">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ivory/40">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-navy-900 px-3.5 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:border-gold-500 sm:w-48";

function AccountTab() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setProfileMessage({ type: "error", text: "Enter your current password to confirm this change" });
      return;
    }
    setProfileBusy(true);
    setProfileMessage(null);
    try {
      const updated = await authService.updateProfile({ name, email, currentPassword });
      setUser(updated);
      setCurrentPassword("");
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setProfileMessage({ type: "error", text: err instanceof Error ? err.message : "Could not update profile" });
    } finally {
      setProfileBusy(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation do not match" });
      return;
    }
    setPasswordBusy(true);
    setPasswordMessage(null);
    try {
      await authService.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Password changed successfully" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err instanceof Error ? err.message : "Could not change password" });
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleProfileSave} className="space-y-4">
        <p className="text-sm font-semibold text-ivory">Profile</p>
        <Field label="Username" hint="Shown as the account name across the admin panel">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email" hint="Used to sign in">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Current password" hint="Required to confirm this change">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </Field>
        <div className="flex items-center justify-end gap-3 pt-2">
          {profileMessage && (
            <span className={cn("text-xs", profileMessage.type === "success" ? "text-emerald-400" : "text-red-400")}>
              {profileMessage.text}
            </span>
          )}
          <Button type="submit" isLoading={profileBusy}>
            <Icon name="check" className="h-4 w-4" />
            Save profile
          </Button>
        </div>
      </form>

      <div className="border-t border-white/5 pt-8">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <p className="text-sm font-semibold text-ivory">Change password</p>
          <Field label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" hint="At least 6 characters">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-2">
            {passwordMessage && (
              <span
                className={cn("text-xs", passwordMessage.type === "success" ? "text-emerald-400" : "text-red-400")}
              >
                {passwordMessage.text}
              </span>
            )}
            <Button type="submit" isLoading={passwordBusy}>
              <Icon name="lock" className="h-4 w-4" />
              Change password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("general");
  const [saved, setSaved] = useState(false);

  const [auctionName, setAuctionName] = useState("Auction Night — Season 2026");
  const [rounds, setRounds] = useState(3);
  const [timer, setTimer] = useState(20);
  const [increment, setIncrement] = useState(500000);
  const [basePrice, setBasePrice] = useState(5000000);
  const [purse, setPurse] = useState(200000000);
  const [autoSold, setAutoSold] = useState(true);
  const [confirmSold, setConfirmSold] = useState(true);
  const [showTicker, setShowTicker] = useState(true);
  const [projectorConfetti, setProjectorConfetti] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Control Room</p>
          <h1 className="text-2xl font-semibold text-ivory sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-ivory/50">Configure tonight's auction — changes are local to this session.</p>
        </div>
        {tab !== "account" && (
          <div className="relative">
            <Button onClick={handleSave}>
              <Icon name="check" className="h-4 w-4" />
              Save changes
            </Button>
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-7 right-0 whitespace-nowrap text-xs font-medium text-emerald-400"
                >
                  Saved locally ✓
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                    tab === t.id ? "bg-gold-500/15 text-gold-400" : "text-ivory/60 hover:bg-white/5 hover:text-ivory"
                  )}
                >
                  <Icon name={t.icon} className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="divide-y divide-white/5"
              >
                {tab === "general" && (
                  <>
                    <Field label="Auction name" hint="Shown across the dashboard and projector screen">
                      <input value={auctionName} onChange={(e) => setAuctionName(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Number of rounds" hint="How many bidding rounds the pool is split into">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={rounds}
                        onChange={(e) => setRounds(Number(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Admin account" hint="Signed in as">
                      <span className="text-sm text-ivory/60">{user?.email}</span>
                    </Field>
                  </>
                )}

                {tab === "rules" && (
                  <>
                    <Field label="Bid timer" hint={`${timer} seconds per lot before it can be closed`}>
                      <input
                        type="range"
                        min={10}
                        max={60}
                        step={5}
                        value={timer}
                        onChange={(e) => setTimer(Number(e.target.value))}
                        className="w-full accent-gold-500 sm:w-48"
                      />
                    </Field>
                    <Field label="Default bid increment" hint="Amount added per raised paddle">
                      <input
                        type="number"
                        step={100000}
                        value={increment}
                        onChange={(e) => setIncrement(Number(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Default base price" hint="Starting price for players without a custom base">
                      <input
                        type="number"
                        step={500000}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Auto-mark unsold on timeout" hint="Close the lot automatically when the timer hits zero">
                      <Toggle checked={autoSold} onChange={setAutoSold} />
                    </Field>
                    <Field label="Confirm before marking sold" hint="Ask the auctioneer to confirm the winning bid">
                      <Toggle checked={confirmSold} onChange={setConfirmSold} />
                    </Field>
                  </>
                )}

                {tab === "purse" && (
                  <>
                    <Field label="Default purse per team" hint="Starting budget assigned to every new franchise">
                      <input
                        type="number"
                        step={1000000}
                        value={purse}
                        onChange={(e) => setPurse(Number(e.target.value))}
                        className={inputClass}
                      />
                    </Field>
                    <div className="py-4">
                      <p className="mb-3 text-sm font-medium text-ivory">Franchises using this purse</p>
                      <p className="text-xs leading-relaxed text-ivory/40">
                        All 8 franchises currently share the same default purse. Per-team overrides will be
                        available once the backend is wired up.
                      </p>
                    </div>
                  </>
                )}

                {tab === "appearance" && (
                  <>
                    <Field label="Live purse ticker" hint="Scrolling purse ticker on the projector screen">
                      <Toggle checked={showTicker} onChange={setShowTicker} />
                    </Field>
                    <Field label="Sold celebration effects" hint="Confetti-style flash when a player is sold">
                      <Toggle checked={projectorConfetti} onChange={setProjectorConfetti} />
                    </Field>
                    <Field label="Compact player cards" hint="Denser grid on the Players page">
                      <Toggle checked={compactCards} onChange={setCompactCards} />
                    </Field>
                    <Field label="Theme" hint="Auction Night runs in dark mode only, tuned for a projector">
                      <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-400">
                        Navy &amp; Gold
                      </span>
                    </Field>
                  </>
                )}

                {tab === "account" && <AccountTab />}
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
