/** Global — the words and users modules both paginate lists this same shape. */
export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
}
