/**
 * Pagination assembly, in one place.
 *
 * This existed three times as copy-pasted argument lists, and `hasNext`/`hasPrev`
 * were independently inverted in two of them — the arguments are positional and
 * both flags are booleans, so nothing catches a swap. Deriving them from
 * `page`/`totalPages` here makes that class of bug unrepresentable.
 */
import { PaginationResultDto } from './pagination-result.dto';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

/** The subset of a filter DTO pagination needs. Structural, so any filter fits. */
export interface PaginationQueryLike {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string[];
  order?: string;
  orderBy?: string;
}

/**
 * Resolves paging inputs and the Prisma `skip`/`take` derived from them, so the
 * off-by-one in `(page - 1) * limit` is written once.
 */
export function resolvePaging(query?: PaginationQueryLike): {
  page: number;
  limit: number;
  skip: number;
  take: number;
} {
  const page = query?.page || DEFAULT_PAGE;
  const limit = query?.limit || DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

/**
 * Builds the paginated envelope. `total` is the unpaged row count, not
 * `data.length` — passing the latter makes `totalPages` always 1.
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  query?: PaginationQueryLike,
): PaginationResultDto<T> {
  const totalPages = Math.ceil(total / limit);

  return new PaginationResultDto<T>(
    data,
    totalPages,
    page,
    limit,
    query?.search || '',
    query?.searchBy?.join(',') || '',
    query?.order || '',
    query?.orderBy || '',
    page < totalPages,
    page > 1,
  );
}
