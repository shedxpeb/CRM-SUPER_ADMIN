export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort?: string;
  filters?: Record<string, unknown>;
}

export interface PaginationResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
