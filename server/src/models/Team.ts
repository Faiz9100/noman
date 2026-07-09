import { Schema, model, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name: string;
  shortName: string;
  logoUrl?: string;
  color?: string;
  owner: string;
  purseTotal: number;
  purseRemaining: number;
  maxPlayers: number;
  players: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, required: true, trim: true, maxlength: 6 },
    logoUrl: { type: String },
    color: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #22d3ee"],
    },
    owner: { type: String, required: true, trim: true },
    // No min/max — the admin can enter any budget, any scale.
    purseTotal: { type: Number, required: true },
    purseRemaining: { type: Number, required: true },
    maxPlayers: { type: Number, default: 25, min: [1, "A team needs room for at least 1 player"] },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

export const Team = model<ITeam>("Team", teamSchema);
