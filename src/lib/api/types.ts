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
