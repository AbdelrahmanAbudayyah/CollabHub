import apiClient from "./client";
import { ApiResponse, PagedResponse } from "../types/api";
import { AppNotification } from "../types/notification";

export async function getNotifications(
  page = 0,
  size = 20
): Promise<PagedResponse<AppNotification>> {
  const response = await apiClient.get<ApiResponse<PagedResponse<AppNotification>>>(
    "/notifications",
    { params: { page, size } }
  );
  return response.data.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<number>>(
    "/notifications/unread-count"
  );
  return response.data.data;
}

export async function markAsRead(id: number): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.put("/notifications/read-all");
}
