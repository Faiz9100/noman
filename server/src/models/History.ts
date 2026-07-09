import { Schema, model, Document, Types } from "mongoose";

export type HistoryStatus = "Sold" | "Unsold";

export interface IHistory extends Document {
  auction: Types.ObjectId;
  player: Types.ObjectId;
  team?: Types.ObjectId;
  price?: number;
  status: HistoryStatus;
  round: number;
  soldAt: Date;
  closedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IHistory>(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    player: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    price: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ["Sold", "Unsold"],
      required: true,
    },
    round: { type: Number, required: true, min: 1 },
    soldAt: { type: Date, default: Date.now },
    closedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

// A player can only be resolved (sold/unsold) once per auction
historySchema.index({ auction: 1, player: 1 }, { unique: true });

export const History = model<IHistory>("History", historySchema);
