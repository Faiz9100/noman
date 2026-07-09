import { connectDB } from "../config/db";
import { Team } from "../models/Team";
import { Player } from "../models/Player";
import { Auction } from "../models/Auction";
import { Bid } from "../models/Bid";
import { History } from "../models/History";
import mongoose from "mongoose";

/**
 * Wipes teams, players, auctions, bids, and history — leaving admin accounts
 * untouched. Unlike `seed:data`, this does not insert any dummy data
 * afterwards, so it's safe to run before adding your own teams and
 * importing your own player CSV.
 *
 *   npm run clear:data
 */
async function clear() {
  await connectDB();

  console.log("[clear:data] Clearing teams, players, auctions, bids, history...");
  const [teams, players, auctions, bids, history] = await Promise.all([
    Team.deleteMany({}),
    Player.deleteMany({}),
    Auction.deleteMany({}),
    Bid.deleteMany({}),
    History.deleteMany({}),
  ]);
  console.log(
    `[clear:data] Removed ${teams.deletedCount} teams, ${players.deletedCount} players, ` +
      `${auctions.deletedCount} auctions, ${bids.deletedCount} bids, ${history.deletedCount} history rows.`
  );

  await mongoose.connection.close();
  process.exit(0);
}

clear().catch((error) => {
  console.error("[clear:data] Failed:", error);
  process.exit(1);
});
