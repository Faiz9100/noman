import { Schema, model, Document, Types } from "mongoose";

export type PlayerRole = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
export type PlayerStatus = "Available" | "Sold" | "Unsold";

export interface IPlayerStats {
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

export interface IPlayer extends Document {
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  basePrice: number;
  photoUrl?: string;
  status: PlayerStatus;
  soldPrice?: number;
  team?: Types.ObjectId;
  stats?: IPlayerStats;
  createdAt: Date;
  updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"],
      default: "Batsman",
    },
    country: { type: String, trim: true, default: "" },
    age: { type: Number, min: 0 },
    battingStyle: { type: String, trim: true },
    bowlingStyle: { type: String, trim: true },
    // No min/max — the admin can enter any base price, any scale.
    basePrice: { type: Number, default: 0 },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ["Available", "Sold", "Unsold"],
      default: "Available",
    },
    soldPrice: { type: Number },
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    stats: {
      matches: Number,
      runs: Number,
      wickets: Number,
      average: Number,
      strikeRate: Number,
      economy: Number,
    },
  },
  { timestamps: true }
);

export const Player = model<IPlayer>("Player", playerSchema);
