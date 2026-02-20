export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
