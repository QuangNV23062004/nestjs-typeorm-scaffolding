export class PaginationResultDto<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  limit: number;
  search: string;
  searchBy: string;
  order: string;
  orderBy: string;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(
    data: T[],
    totalPages: number,
    currentPage: number,
    limit: number,
    search: string,
    searchBy: string,
    order: string,
    orderBy: string,
    hasNext: boolean,
    hasPrev: boolean,
  ) {
    this.data = data;
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.limit = limit;
    this.search = search;
    this.searchBy = searchBy;
    this.order = order;
    this.orderBy = orderBy;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
  }
}
