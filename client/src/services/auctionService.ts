import { api } from "./api";
import { ApiResponse, Auction, AuctionStatus } from "../types";

export const auctionService = {
  async getAll(status?: AuctionStatus): Promise<Auction[]> {
    const { data } = await api.get<ApiResponse<Auction[]>>("/auctions", { params: status ? { status } : undefined });
    return data.data;
  },

  async getById(id: string): Promise<Auction> {
    const { data } = await api.get<ApiResponse<Auction>>(`/auctions/${id}`);
    return data.data;
  },

  /**
   * Resolves "the auction the control room / projector should be pointed
   * at right now" — the most recently created auction that isn't finished,
   * preferring one already in progress over one still waiting to start.
   * Falls back to the most recent completed auction so a finished night
   * still shows a "complete" screen instead of "nothing configured".
   */
  async getActive(): Promise<Auction | null> {
    const [live, paused, draft, completed, closed] = await Promise.all([
      this.getAll("live"),
      this.getAll("paused"),
      this.getAll("draft"),
      this.getAll("completed"),
      this.getAll("closed"),
    ]);
    return live[0] ?? paused[0] ?? draft[0] ?? completed[0] ?? closed[0] ?? null;
  },

  async pause(id: string): Promise<Auction> {
    const { data } = await api.post<ApiResponse<Auction>>(`/auctions/${id}/pause`);
    return data.data;
  },

  async resume(id: string): Promise<Auction> {
    const { data } = await api.post<ApiResponse<Auction>>(`/auctions/${id}/resume`);
    return data.data;
  },

  async end(id: string): Promise<Auction> {
    const { data } = await api.post<ApiResponse<Auction>>(`/auctions/${id}/end`);
    return data.data;
  },

  async reset(id: string): Promise<Auction> {
    const { data } = await api.post<ApiResponse<Auction>>(`/auctions/${id}/reset`);
    return data.data;
  },
};
