import { api } from "./api";
import { ApiResponse, EngineBid } from "../types";

export const bidService = {
  async getForLot(auctionId: string, playerId: string): Promise<EngineBid[]> {
    const { data } = await api.get<ApiResponse<EngineBid[]>>("/bids", {
      params: { auction: auctionId, player: playerId },
    });
    return data.data;
  },
};
