import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/common/database/prisma.service';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { Prisma } from 'src/generated/prisma';
import { AccountEntity } from './account.entity';
import { FilterAccountDto } from './dtos/filter-account.dto';
import { Role } from './enums/role.enum';

/** Columns the API is allowed to search/sort by, mapped to Prisma field names. */
const SEARCHABLE_FIELDS = ['username', 'email', 'role', 'status'] as const;
const SORTABLE_FIELDS: Record<string, keyof Prisma.AccountOrderByWithRelationInput> =
  {
    username: 'username',
    email: 'email',
    created_at: 'createdAt',
    createdAt: 'createdAt',
    updated_at: 'updatedAt',
    updatedAt: 'updatedAt',
  };

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

  /** Prisma returns plain objects; @Exclude() only applies to class instances. */
  private toEntity(row: unknown): AccountEntity {
    return plainToInstance(AccountEntity, row);
  }

  private toEntities(rows: unknown[]): AccountEntity[] {
    return rows.map((row) => this.toEntity(row));
  }

  /** Shared filter for FindAll/FindPaginated so both stay in sync. */
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
    account: Partial<AccountEntity>,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountEntity> {
    const created = await this.db(tx).account.create({
      data: {
        username: account.username as string,
        email: account.email as string,
        passwordHash: account.passwordHash as string,
        passwordSalt: account.passwordSalt as string,
        ...(account.role !== undefined ? { role: account.role } : {}),
        ...(account.status !== undefined ? { status: account.status } : {}),
      },
    });
    return this.toEntity(created);
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountEntity | null> {
    const row = await this.db(tx).account.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
    return row ? this.toEntity(row) : null;
  }

  //ignore page & limit
  async FindAll(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountEntity[]> {
    const rows = await this.db(tx).account.findMany({
      where: this.buildWhere(includeDeleted, excludeId, role, query),
      orderBy: this.buildOrderBy(query),
    });
    return this.toEntities(rows);
  }

  async FindPaginated(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginationResultDto<AccountEntity>> {
    const db = this.db(tx);
    const where = this.buildWhere(includeDeleted, excludeId, role, query);

    const page = query?.page || 1;
    const limit = query?.limit || 10;

    const [totalItems, rows] = await Promise.all([
      db.account.count({ where }),
      db.account.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return new PaginationResultDto<AccountEntity>(
      this.toEntities(rows),
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
  ): Promise<AccountEntity | null> {
    const row = await this.db(tx).account.findFirst({
      where: includeDeleted ? { email } : { email, isDeleted: false },
    });
    return row ? this.toEntity(row) : null;
  }

  async Update(
    account: AccountEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountEntity> {
    const updated = await this.db(tx).account.update({
      where: { id: account.id },
      data: {
        username: account.username,
        email: account.email,
        passwordHash: account.passwordHash,
        passwordSalt: account.passwordSalt,
        role: account.role,
        status: account.status,
        isDeleted: account.isDeleted,
      },
    });
    return this.toEntity(updated);
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
