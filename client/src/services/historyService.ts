import { api } from "./api";
import { ApiResponse, AuctionHistoryEntry, DashboardStats } from "../types";

export const historyService = {
  async getAll(filters?: { auction?: string; team?: string; status?: string }): Promise<AuctionHistoryEntry[]> {
    const { data } = await api.get<ApiResponse<AuctionHistoryEntry[]>>("/history", { params: filters });
    return data.data;
  },

  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<ApiResponse<DashboardStats>>("/history/stats");
    return data.data;
  },

  async undo(id: string): Promise<void> {
    await api.delete(`/history/${id}`);
  },

  /**
   * Downloads the CSV export as an authenticated request (the endpoint is
   * behind `protect`, and the frontend/backend are on different domains in
   * production, so a plain `<a href>` can't carry the auth header — we fetch
   * as a blob and trigger the save ourselves instead).
   */
  async exportCsv(auctionId?: string): Promise<void> {
    const response = await api.get("/history/export", {
      params: auctionId ? { auction: auctionId } : undefined,
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auction-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
