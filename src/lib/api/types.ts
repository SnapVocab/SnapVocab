export type Meta = {
  page: number;
  size: number;
  total: number;
  pages: number;
};

export type PaginateResponse<T> = {
  data: T[];
  meta: Meta;
};

export type CursorPaginationResponse<T> = {
  data: T[];
  nextCursor: number | null;
  hasNext: boolean;
};
