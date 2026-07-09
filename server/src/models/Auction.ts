import { Schema, model, Document, Types } from "mongoose";

/**
 * "completed" = every player was sold, the auction ended itself.
 * "closed" = the admin manually ended it early via "Close Auction" —
 * distinct so the UI can show "Auction Closed" instead of "Complete".
 */
export type AuctionStatus = "draft" | "live" | "paused" | "completed" | "closed";

export interface IAuction extends Document {
  name: string;
  season?: string;
  status: AuctionStatus;
  rounds: number;
  currentRound: number;
  bidTimerSeconds: number;
  bidIncrements: number[];
  currentPlayer?: Types.ObjectId;
  currentBid: number;
  leadingTeam?: Types.ObjectId;
  biddingOpen: boolean;
  startedAt?: Date;
  endedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const auctionSchema = new Schema<IAuction>(
  {
    name: {
      type: String,
      required: [true, "Auction name is required"],
      trim: true,
      maxlength: [120, "Auction name cannot exceed 120 characters"],
    },
    season: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "live", "paused", "completed", "closed"],
      default: "draft",
    },
    rounds: { type: Number, default: 1, min: [1, "Rounds must be at least 1"] },
    currentRound: { type: Number, default: 1, min: 1 },
    bidTimerSeconds: {
      type: Number,
      default: 30,
      min: [5, "Bid timer must be at least 5 seconds"],
    },
    bidIncrements: {
      type: [Number],
      default: [100, 500, 1000, 5000, 10000],
      validate: {
        validator: (arr: number[]) => arr.every((n) => n > 0),
        message: "Bid increments must all be positive numbers",
      },
    },
    currentPlayer: { type: Schema.Types.ObjectId, ref: "Player", default: null },
    currentBid: { type: Number, default: 0, min: 0 },
    leadingTeam: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    biddingOpen: { type: Boolean, default: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

export const Auction = model<IAuction>("Auction", auctionSchema);
