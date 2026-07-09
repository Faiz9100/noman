import { Schema, model, Document, Types } from "mongoose";

export interface IBid extends Document {
  auction: Types.ObjectId;
  player: Types.ObjectId;
  team: Types.ObjectId;
  amount: number;
  round: number;
  placedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema<IBid>(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [1, "Bid amount must be greater than 0"],
    },
    round: { type: Number, required: true, min: 1 },
    placedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

// Speeds up the common "bid history for this lot, most recent first" query
bidSchema.index({ auction: 1, player: 1, createdAt: -1 });

export const Bid = model<IBid>("Bid", bidSchema);
