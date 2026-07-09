import { connectDB } from "../config/db";
import { Admin } from "../models/Admin";
import { Team } from "../models/Team";
import { Player } from "../models/Player";
import { Auction } from "../models/Auction";
import { Bid } from "../models/Bid";
import { History } from "../models/History";
import mongoose from "mongoose";

/**
 * Seeds a full, fresh auction night: 8 franchises, 20 unsold players, and
 * one draft Auction ready for an admin to start. Wipes existing team/player/
 * auction/bid/history data first so this can be re-run to reset a demo.
 *
 * Prices are plain numbers with no fixed scale (no forced Lakh/Crore
 * units) — same as the admin can type in the UI.
 *
 *   npm run seed:data
 */

const TEAMS = [
  { name: "Coastal Titans", shortName: "TIT", owner: "A. Sharma", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Desert Warriors", shortName: "WAR", owner: "M. Khan", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Highland Strikers", shortName: "STR", owner: "R. Fernandes", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Valley Falcons", shortName: "FAL", owner: "K. Patel", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Riverside Royals", shortName: "ROY", owner: "S. Iyer", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Metro Panthers", shortName: "PAN", owner: "J. D'Souza", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Northern Chargers", shortName: "CHG", owner: "V. Nair", purseTotal: 200_000, maxPlayers: 15 },
  { name: "Summit Sultans", shortName: "SUL", owner: "T. Chen", purseTotal: 200_000, maxPlayers: 15 },
];

const PLAYERS = [
  { name: "Arjun Mehta", role: "Batsman", country: "India", age: 27, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 50000, stats: { matches: 84, runs: 3120, average: 46.2, strikeRate: 138.4 } },
  { name: "Daniel Cole", role: "Batsman", country: "Australia", age: 29, battingStyle: "Left-hand bat", bowlingStyle: "", basePrice: 25000, stats: { matches: 61, runs: 2210, average: 39.8, strikeRate: 129.7 } },
  { name: "Marcus Reid", role: "Bowler", country: "England", age: 26, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", basePrice: 15000, stats: { matches: 72, wickets: 98, average: 22.4, economy: 7.8 } },
  { name: "Kabir Singh", role: "All-Rounder", country: "India", age: 24, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium", basePrice: 100000, stats: { matches: 90, runs: 1850, wickets: 64, strikeRate: 145.1, economy: 7.2 } },
  { name: "Liam Foster", role: "Bowler", country: "New Zealand", age: 25, battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast", basePrice: 12500, stats: { matches: 55, wickets: 71, average: 24.1, economy: 8.1 } },
  { name: "Rohan Verma", role: "Wicket-Keeper", country: "India", age: 23, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 20000, stats: { matches: 68, runs: 1740, average: 33.5, strikeRate: 132.0 } },
  { name: "Ethan Brooks", role: "Batsman", country: "South Africa", age: 28, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 5000, stats: { matches: 49, runs: 1610, average: 35.7, strikeRate: 124.3 } },
  { name: "Yusuf Khan", role: "All-Rounder", country: "Pakistan", age: 30, battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-spin", basePrice: 35000, stats: { matches: 77, runs: 1420, wickets: 58, economy: 7.5 } },
  { name: "Vikram Rathore", role: "Bowler", country: "India", age: 22, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-spin", basePrice: 8000, stats: { matches: 63, wickets: 84, average: 21.9, economy: 6.9 } },
  { name: "Josh Miller", role: "Bowler", country: "Australia", age: 31, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", basePrice: 7500, stats: { matches: 58, wickets: 76, average: 23.6, economy: 8.4 } },
  { name: "Imran Sheikh", role: "Bowler", country: "Pakistan", age: 27, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm orthodox", basePrice: 10000, stats: { matches: 66, wickets: 91, average: 20.8, economy: 7.1 } },
  { name: "Callum West", role: "Batsman", country: "England", age: 26, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 6000, stats: { matches: 52, runs: 1890, average: 41.1, strikeRate: 141.2 } },
  { name: "Naveen Kumar", role: "All-Rounder", country: "India", age: 25, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm medium-fast", basePrice: 75000, stats: { matches: 81, runs: 1620, wickets: 69, strikeRate: 128.9, economy: 7.6 } },
  { name: "Trent Walsh", role: "Batsman", country: "New Zealand", age: 24, battingStyle: "Left-hand bat", bowlingStyle: "", basePrice: 4000, stats: { matches: 47, runs: 1480, average: 34.9, strikeRate: 118.5 } },
  { name: "Sipho Nkosi", role: "Bowler", country: "South Africa", age: 29, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", basePrice: 3000, stats: { matches: 44, wickets: 62, average: 25.3, economy: 8.6 } },
  { name: "Rahul Deshmukh", role: "All-Rounder", country: "India", age: 32, battingStyle: "Right-hand bat", bowlingStyle: "Right-arm off-spin", basePrice: 999999, stats: { matches: 88, runs: 2040, wickets: 73, strikeRate: 133.7, economy: 6.8 } },
  { name: "Dhruv Kapoor", role: "Wicket-Keeper", country: "India", age: 21, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 2500, stats: { matches: 59, runs: 1560, average: 32.8, strikeRate: 127.4 } },
  { name: "Sam Whittaker", role: "Wicket-Keeper", country: "England", age: 28, battingStyle: "Left-hand bat", bowlingStyle: "", basePrice: 1500, stats: { matches: 45, runs: 1180, average: 30.1, strikeRate: 121.9 } },
  { name: "Michael Stone", role: "Batsman", country: "Australia", age: 30, battingStyle: "Right-hand bat", bowlingStyle: "", basePrice: 250000, stats: { matches: 70, runs: 2450, average: 43.5, strikeRate: 136.8 } },
  { name: "Zaid Ansari", role: "Bowler", country: "India", age: 23, battingStyle: "Right-hand bat", bowlingStyle: "Left-arm fast-medium", basePrice: 500, stats: { matches: 48, wickets: 66, average: 22.9, economy: 7.3 } },
];

async function seed() {
  await connectDB();

  const admin = await Admin.findOne().sort({ createdAt: 1 });
  if (!admin) {
    throw new Error("No admin account exists yet — run `npm run seed` first to create one.");
  }

  console.log("[seed:data] Clearing existing teams, players, auctions, bids, history...");
  await Promise.all([
    Team.deleteMany({}),
    Player.deleteMany({}),
    Auction.deleteMany({}),
    Bid.deleteMany({}),
    History.deleteMany({}),
  ]);

  const teams = await Team.insertMany(TEAMS.map((t) => ({ ...t, purseRemaining: t.purseTotal, players: [] })));
  console.log(`[seed:data] Created ${teams.length} teams`);

  const players = await Player.insertMany(
    PLAYERS.map((p) => ({
      ...p,
      battingStyle: p.battingStyle || undefined,
      bowlingStyle: p.bowlingStyle || undefined,
      status: "Available",
    }))
  );
  console.log(`[seed:data] Created ${players.length} players`);

  const auction = await Auction.create({
    name: "Auction Night — Season 2026",
    season: "2026",
    bidTimerSeconds: 30,
    bidIncrements: [100, 500, 1000, 5000, 10000],
    createdBy: admin._id,
  });
  console.log(`[seed:data] Created draft auction "${auction.name}" (${auction.id}) — ready to start`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error("[seed:data] Failed:", error);
  process.exit(1);
});
