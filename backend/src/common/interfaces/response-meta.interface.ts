export interface ResponseMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort?: string;
  filters?: Record<string, unknown>;
}
