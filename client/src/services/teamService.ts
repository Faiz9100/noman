import { api } from "./api";
import { ApiResponse, Team } from "../types";

export const teamService = {
  async getAll(): Promise<Team[]> {
    const { data } = await api.get<ApiResponse<Team[]>>("/teams");
    return data.data;
  },

  async getById(id: string): Promise<Team> {
    const { data } = await api.get<ApiResponse<Team>>(`/teams/${id}`);
    return data.data;
  },

  async create(payload: FormData): Promise<Team> {
    const { data } = await api.post<ApiResponse<Team>>("/teams", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: FormData): Promise<Team> {
    const { data } = await api.put<ApiResponse<Team>>(`/teams/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },
};
