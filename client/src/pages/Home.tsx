import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { StatDigit } from "../components/common/StatDigit";
import { Icon } from "../components/common/Icon";
import { ROUTES } from "../utils/constants";
import { teamService } from "../services/teamService";
import { playerService } from "../services/playerService";

const features = [
  {
    title: "Live Bidding Board",
    desc: "A projector-ready scoreboard view built for a packed room, not a laptop screen.",
  },
  {
    title: "Real-Time Sync",
    desc: "Every bid, sale, and purse update reaches every screen instantly over a live socket connection.",
  },
  {
    title: "Squad & Purse Tracking",
    desc: "Each franchise's remaining purse and roster stays accurate as the auction moves.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

export function Home() {
  const [teamCount, setTeamCount] = useState<number | null>(null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  useEffect(() => {
    teamService.getAll().then((t) => setTeamCount(t.length)).catch(() => undefined);
    playerService.getAll().then((p) => setPlayerCount(p.length)).catch(() => undefined);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stadium-glow">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="eyebrow mb-4 text-center"
          >
            Season 2026 &middot; Player Auction
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center text-4xl font-semibold leading-tight text-ivory sm:text-6xl"
          >
            Where every bid
            <span className="block text-gold-500">writes the squad.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-center text-ivory/60"
          >
            A live auction platform built for the room, the projector, and the
            franchise owners racing against a shrinking purse.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to={ROUTES.ADMIN_LOGIN}>
              <Button size="lg">
                <Icon name="shield" className="h-4 w-4" />
                Admin login
              </Button>
            </Link>
            <Link to={ROUTES.PROJECTOR} target="_blank">
              <Button variant="outline" size="lg">
                <Icon name="tv" className="h-4 w-4" />
                Open projector screen
              </Button>
            </Link>
          </motion.div>

          <div className="seam-divider my-16" />

          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            <StatDigit value={teamCount !== null ? String(teamCount).padStart(2, "0") : "—"} label="Franchises" className="items-center text-center" />
            <StatDigit value={playerCount !== null ? `${playerCount}+` : "—"} label="Players Pool" className="items-center text-center" />
            <StatDigit value="₹2Cr" label="Max Purse" className="items-center text-center" />
            <StatDigit value="LIVE" label="Auction Night" className="items-center text-center" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="eyebrow mb-3">Built for match night</p>
          <h2 className="text-3xl font-semibold text-ivory sm:text-4xl">
            One board. Every eye in the room.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Card hoverable className="h-full">
                <h3 className="mb-2 font-display text-lg font-semibold text-gold-400">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-ivory/60">{feature.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
