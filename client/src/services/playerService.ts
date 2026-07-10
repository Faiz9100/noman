import { api } from "./api";
import { ApiResponse, BulkPhotoResult, CsvImportResult, Player } from "../types";

export const playerService = {
  async getAll(filters?: { status?: string; role?: string; search?: string }): Promise<Player[]> {
    const { data } = await api.get<ApiResponse<Player[]>>("/players", { params: filters });
    return data.data;
  },

  async getById(id: string): Promise<Player> {
    const { data } = await api.get<ApiResponse<Player>>(`/players/${id}`);
    return data.data;
  },

  async create(payload: FormData): Promise<Player> {
    const { data } = await api.post<ApiResponse<Player>>("/players", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: FormData): Promise<Player> {
    const { data } = await api.put<ApiResponse<Player>>(`/players/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/players/${id}`);
  },

  async importCsv(file: File): Promise<CsvImportResult> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<ApiResponse<CsvImportResult>>("/players/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /** Matches each file's name (minus extension) against a player's name — see bulkUploadPhotos on the server. */
  async bulkUploadPhotos(files: File[]): Promise<BulkPhotoResult> {
    const form = new FormData();
    files.forEach((file) => form.append("photos", file));
    const { data } = await api.post<ApiResponse<BulkPhotoResult>>("/players/photos/bulk", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
};
