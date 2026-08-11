import { Prisma, User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { FilterUserDto } from './dtos/filter-user.dto';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { paginated, resolvePaging } from 'src/common/pagination/paginate';
import { Tracing } from 'src/decorators';

/**
 * Rows from the follow-graph batch fetches: the key plus its edge list, not a
 * full User. Declaring `User[]` there would be wrong twice over — it promises
 * name/email/avatar that `select` never fetches, and hides the one field the
 * caller wants.
 */
export type UserFollowers = { id: string; followers: User[] };
export type UserFollowing = { id: string; following: User[] };


const SORTABLE_FIELDS: Record<
  string,
  keyof Prisma.UserOrderByWithRelationInput
> = {
  name: 'name',
  email: 'email',
  created_at: 'createdAt',
  createdAt: 'createdAt',
  updated_at: 'updatedAt',
  updatedAt: 'updatedAt',
};

@Injectable()
export class UserRepository extends BaseRepository {
  // Redeclared so Nest emits design:paramtypes on the concrete class.
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /** Shared filter so FindAll and FindPaginated cannot drift apart. */
  private buildWhere(
    includeDeleted?: boolean,
    excludeId?: string,
    query?: FilterUserDto,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = excludeId ? {
      id: { not: excludeId },
    } : {};



    if (!includeDeleted) {
      where.isDeleted = false;
    }

    const searchBy = query?.searchBy;
    const search = query?.search?.trim();
    if (
      search &&
      searchBy
    ) {
      if (searchBy.length > 0) {
        where.OR = searchBy.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }
    }

    return where;
  }


  private buildOrderBy(
    query?: FilterUserDto,
  ): Prisma.UserOrderByWithRelationInput | undefined {
    if (!query?.orderBy || !query?.order) return undefined;

    const field = SORTABLE_FIELDS[query.orderBy];
    if (!field) return undefined;

    return { [field]: query.order.toLowerCase() as Prisma.SortOrder };
  }


  @Tracing()
  async Create(
    user: Prisma.UserCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return await this.db(tx).user.create({ data: user });
  }

  async FindAll(
    includeDeleted?: boolean,
    excludeId?: string,
    query?: FilterUserDto,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    const where = this.buildWhere(includeDeleted, excludeId, query);
    const orderBy = this.buildOrderBy(query);
    const users = await this.db(tx).user.findMany({
      where,
      orderBy,
    });
    return users;
  }


  async FindPaginated(
    includeDeleted: boolean,
    excludeId: string,
    query?: FilterUserDto,
    tx?: Prisma.TransactionClient,): Promise<PaginationResultDto<User>> {
    const where = this.buildWhere(includeDeleted, excludeId, query);
    const orderBy = this.buildOrderBy(query);
    const { page, limit, skip, take } = resolvePaging(query);
    const [items, total] = await Promise.all([
      this.db(tx).user.findMany({ where, orderBy, skip, take }),
      this.db(tx).user.count({ where }),
    ]);

    return paginated(items, total, page, limit, query);
  }

  async FindById(id: string, includeDeleted: boolean, tx?: Prisma.TransactionClient): Promise<User | null> {
    const where: Prisma.UserWhereInput = { id };
    if (!includeDeleted) {
      where.isDeleted = false;
    }
    return await this.db(tx).user.findFirst({ where });
  }

  async FindByIds(
    ids: string[],
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient
  ): Promise<User[]> {
    if (!ids || ids?.length === 0) {
      return []
    }
    const where: Prisma.UserWhereInput = {
      id: { in: ids }
    }
    if (!includeDeleted) {
      where.isDeleted = false;
    }
    return await this.db(tx).user.findMany({ where });
  }

  async Update(id: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient): Promise<User | null> {
    return await this.db(tx).user.update({ where: { id }, data });
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    return await this.db(tx).user.update({ where: { id }, data: { isDeleted: true } });
  }

  async hardDelete(id: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    return await this.db(tx).user.delete({ where: { id } });
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    return await this.db(tx).user.update({ where: { id }, data: { isDeleted: false } });
  }

  /**
   * Batch fetch for the follow graph. `_UserFollows` is an implicit join table
   * with no Prisma model, so it can only be reached through the relation field
   * — there is no child-side FK to filter on the way authorId works for posts.
   *
   * Keyed by parent id: each row carries the id it was requested under, so a
   * DataLoader can group without a second pass. Rows are absent for ids that
   * are missing or soft-deleted, so the loader must map those to [].
   *
   * `select` is inline rather than hoisted to a `Prisma.UserSelect` variable:
   * the annotation widens the literal and Prisma loses the row shape, which is
   * what let the old `Promise<User[]>` compile.
   */
  async fetchUsersFollowers(
    ids: string[],
    includeDeleted?: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<UserFollowers[]> {
    if (!ids || ids.length === 0) return [];
    return await this.db(tx).user.findMany({
      where: includeDeleted
        ? { id: { in: ids } }
        : { id: { in: ids }, isDeleted: false },
      select: {
        id: true,
        followers: { where: includeDeleted ? undefined : { isDeleted: false } },
      },
    });
  }

  async fetchUsersFollowing(
    ids: string[],
    includeDeleted?: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<UserFollowing[]> {
    if (!ids || ids.length === 0) return [];
    return await this.db(tx).user.findMany({
      where: includeDeleted
        ? { id: { in: ids } }
        : { id: { in: ids }, isDeleted: false },
      select: {
        id: true,
        following: { where: includeDeleted ? undefined : { isDeleted: false } },
      },
    });
  }
}