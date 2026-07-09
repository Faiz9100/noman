import mongoose from "mongoose";
import { env } from "./env";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Establishes the Mongoose connection to MongoDB, retrying a few times with
 * a fixed delay before giving up. Atlas free-tier clusters and local mongod
 * both occasionally aren't reachable on the very first attempt (cluster
 * waking from idle, container startup ordering, etc.) — without a retry,
 * that transient blip permanently exits the process and every API request
 * fails with a network error until someone manually restarts the server.
 * Exits the process only after every retry is exhausted, so the platform
 * (PM2/Docker/Render/etc.) can still restart it as a last resort.
 */
export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log(`[db] MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`[db] Connection attempt ${attempt}/${MAX_RETRIES} failed:`, (error as Error).message);
      if (attempt === MAX_RETRIES) {
        console.error("[db] Giving up after max retries. Check MONGO_URI and that the database is reachable.");
        process.exit(1);
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

// Once connected, keep the process alive through drops and let the driver's
// own reconnection logic (bufferCommands) recover — Mongoose queues queries
// made while disconnected and replays them on reconnect instead of erroring.
mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected — attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[db] MongoDB reconnected");
});
