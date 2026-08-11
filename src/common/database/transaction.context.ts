/**
 * Ambient transaction propagation.
 *
 * The explicit `tx?: Prisma.TransactionClient` parameter works, but it is opt-in
 * at every call site: one method that forgets to thread `tx` down runs its query
 * outside the transaction, with no error and no rollback coverage. That failure
 * is invisible in review and in tests that only assert the happy path.
 *
 * AsyncLocalStorage removes the choice. `@Transactional()` opens the transaction
 * and puts the client in the store; `BaseRepository.db()` reads it. Nothing in
 * between has to know a transaction is in progress.
 *
 * The explicit parameter still wins where it is passed, so existing call sites
 * keep working and there is an escape hatch for the rare query that must NOT
 * join the ambient transaction.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma, PrismaClient } from '@prisma/client';

const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

/** The ambient transaction client, or undefined outside `@Transactional()`. */
export function getTransactionClient(): Prisma.TransactionClient | undefined {
  return transactionStorage.getStore();
}

/** Runs `fn` with `tx` as the ambient transaction client. */
export function runInTransaction<T>(
  tx: Prisma.TransactionClient,
  fn: () => T,
): T {
  return transactionStorage.run(tx, fn);
}

/**
 * Fallback client for `@Transactional()` on classes that do not inject
 * PrismaService themselves — a service composed only of repositories, say.
 * PrismaService registers itself on init; there is exactly one per process.
 */
let registeredClient: PrismaClient | undefined;

export function registerTransactionClient(client: PrismaClient): void {
  registeredClient = client;
}

type PrismaHolder = { prisma?: { $transaction?: unknown } };

function resolveClient(self: unknown): PrismaClient {
  // Prefer the instance's own client so a class that injects PrismaService is
  // self-contained and testable without touching module state.
  const own = (self as PrismaHolder)?.prisma;
  if (own && typeof own.$transaction === 'function') {
    return own as PrismaClient;
  }
  if (registeredClient) return registeredClient;
  throw new Error(
    '@Transactional() found no PrismaClient. Inject PrismaService as `prisma` ' +
      'on the decorated class, or make sure PrismaModule is imported so ' +
      'PrismaService can register itself.',
  );
}

export interface TransactionalOptions {
  /** Max ms the transaction may run before Prisma aborts it (P2028). Default 5000. */
  timeout?: number;
  /** Max ms to wait for a connection from the pool. Default 2000. */
  maxWait?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Runs the decorated async method inside a transaction.
 *
 * Nesting joins the outer transaction rather than opening a second one: Prisma
 * has no nested transactions, and `$transaction` inside `$transaction` on the
 * same connection deadlocks against itself.
 *
 * Belongs on service methods, not repository methods — a transaction is a
 * use-case boundary, and a single repository call is too small to own one.
 *
 * Only decorate async methods: the wrapper always returns a Promise.
 */
export function Transactional(
  options: TransactionalOptions = {},
): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      if (getTransactionClient()) {
        // Already inside one — join it.
        return original.apply(this, args);
      }
      const client = resolveClient(this);
      return client.$transaction(
        (tx) => runInTransaction(tx, () => original.apply(this, args)),
        options,
      );
    };

    return descriptor;
  };
}
