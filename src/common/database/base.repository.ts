/**
 * Shared plumbing for every repository: client resolution and transactions.
 *
 * Model-specific logic stays in the subclass. `buildWhere` in particular is not
 * inherited — the filters differ per model, and a base version would either be
 * `any`-typed or grow a flag per caller.
 *
 * Subclasses must redeclare the constructor and call `super(prisma)`. Nest reads
 * `design:paramtypes` off the concrete class, and a class with no constructor of
 * its own emits no such metadata, so DI would inject nothing.
 */
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { getTransactionClient, runInTransaction } from './transaction.context';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Client for a query, in precedence order:
   *   1. `tx` passed explicitly by the caller
   *   2. the ambient transaction opened by `@Transactional()`
   *   3. the plain client
   *
   * Explicit first so a caller can still force a query onto the plain client
   * (or a different transaction) while inside an ambient one.
   */
  protected db(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return tx ?? getTransactionClient() ?? this.prisma;
  }

  /**
   * Runs `fn` inside a transaction, joining an ambient one if present.
   *
   * The client is also published to AsyncLocalStorage, so repository calls
   * inside `fn` join it without being passed `tx` — though `fn` still receives
   * it for call sites that prefer to be explicit.
   */
  async Transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const ambient = getTransactionClient();
    if (ambient) return fn(ambient);

    return this.prisma.$transaction((tx) =>
      runInTransaction(tx, () => fn(tx)),
    );
  }
}
