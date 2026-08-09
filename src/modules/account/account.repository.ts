import { Injectable } from '@nestjs/common';
import { Account, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { FilterAccountDto } from './dtos/filter-account.dto';
import { Role } from './enums/role.enum';

/**
 * What queries actually return: PrismaService sets a global `omit` for the
 * credential columns, so they are absent at runtime.
 *
 * This alias has to be written by hand. The global omit is a runtime client
 * option, and because PrismaService extends PrismaClient without threading its
 * options generic, Prisma's `Account` type still advertises passwordHash —
 * reading it would compile and be `undefined`. Declaring the omission here puts
 * the type back in step with the runtime, so a leak fails to compile.
 */
export type SafeAccount = Omit<Account, 'passwordHash' | 'passwordSalt'>;

/** The full row, including credentials. Only the two auth paths get this. */
export type AccountWithCredentials = Account;

/** Columns the API may search/sort by, mapped to Prisma field names. */
const SEARCHABLE_FIELDS = ['username', 'email', 'role', 'status'] as const;
const SORTABLE_FIELDS: Record<
  string,
  keyof Prisma.AccountOrderByWithRelationInput
> = {
  username: 'username',
  email: 'email',
  created_at: 'createdAt',
  createdAt: 'createdAt',
  updated_at: 'updatedAt',
  updatedAt: 'updatedAt',
};

/** Re-includes the credential columns the global omit strips. */
const WITH_CREDENTIALS = {
  passwordHash: false,
  passwordSalt: false,
} as const;

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma's transaction client where a caller passes one, otherwise the plain
   * client. Replaces TypeORM's GetRepository(entityManager).
   */
  private db(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  /**
   * Runs `fn` inside a transaction. Callers pass the received `tx` down into
   * any repository method so every write joins the same transaction.
   */
  async Transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /** Shared filter so FindAll and FindPaginated cannot drift apart. */
  private buildWhere(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
  ): Prisma.AccountWhereInput {
    const where: Prisma.AccountWhereInput = {
      id: { not: excludeId },
      role: { in: role },
    };

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    const searchBy = query?.searchBy;
    const search = query?.search?.trim();
    if (
      search &&
      searchBy &&
      (SEARCHABLE_FIELDS as readonly string[]).includes(searchBy)
    ) {
      where[searchBy as (typeof SEARCHABLE_FIELDS)[number]] = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return where;
  }

  private buildOrderBy(
    query?: FilterAccountDto,
  ): Prisma.AccountOrderByWithRelationInput | undefined {
    if (!query?.orderBy || !query?.order) return undefined;

    const field = SORTABLE_FIELDS[query.orderBy];
    if (!field) return undefined;

    return { [field]: query.order.toLowerCase() as Prisma.SortOrder };
  }

  async Create(
    account: Prisma.AccountCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SafeAccount> {
    return this.db(tx).account.create({ data: account });
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<SafeAccount | null> {
    return this.db(tx).account.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
  }

  /**
   * Only for password verification. Everything else must use FindById — this
   * is the single place the hash re-enters application memory by id.
   */
  async FindByIdWithCredentials(
    id: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountWithCredentials | null> {
    return this.db(tx).account.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
      omit: WITH_CREDENTIALS,
    });
  }

  //ignore page & limit
  async FindAll(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    tx?: Prisma.TransactionClient,
  ): Promise<SafeAccount[]> {
    return this.db(tx).account.findMany({
      where: this.buildWhere(includeDeleted, excludeId, role, query),
      orderBy: this.buildOrderBy(query),
    });
  }

  async FindPaginated(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginationResultDto<SafeAccount>> {
    const db = this.db(tx);
    const where = this.buildWhere(includeDeleted, excludeId, role, query);

    const page = query?.page || 1;
    const limit = query?.limit || 10;

    const [totalItems, items] = await Promise.all([
      db.account.count({ where }),
      db.account.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return new PaginationResultDto<SafeAccount>(
      items,
      totalPages,
      page,
      limit,
      query?.search || '',
      query?.searchBy || '',
      query?.order || '',
      query?.orderBy || '',
      page < totalPages,
      page > 1,
    );
  }

  async FindByEmail(
    email: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<SafeAccount | null> {
    return this.db(tx).account.findFirst({
      where: includeDeleted ? { email } : { email, isDeleted: false },
    });
  }

  /** Only for login. See FindByIdWithCredentials. */
  async FindByEmailWithCredentials(
    email: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountWithCredentials | null> {
    return this.db(tx).account.findFirst({
      where: includeDeleted ? { email } : { email, isDeleted: false },
      omit: WITH_CREDENTIALS,
    });
  }

  async Update(
    id: string,
    data: Prisma.AccountUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SafeAccount> {
    return this.db(tx).account.update({ where: { id }, data });
  }

  async SoftDelete(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const result = await this.db(tx).account.updateMany({
      where: { id },
      data: { isDeleted: true },
    });
    return result.count > 0;
  }

  async HardDelete(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const result = await this.db(tx).account.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async Restore(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const result = await this.db(tx).account.updateMany({
      where: { id },
      data: { isDeleted: false },
    });
    return result.count > 0;
  }
}
