/**
 * Ambient transaction propagation.
 *
 * The explicit `entityManager?: EntityManager` parameter works, but it is opt-in
 * at every call site: one method that forgets to thread it down runs its query
 * outside the transaction, with no error and no rollback coverage. That failure
 * is invisible in review and in tests that only assert the happy path — this
 * repository shipped exactly that bug in ResetPassword.
 *
 * AsyncLocalStorage removes the choice. `@Transactional()` opens the transaction
 * and puts the manager in the store; `BaseRepository.GetRepository()` reads it.
 * Nothing in between has to know a transaction is in progress.
 *
 * The explicit parameter still wins where it is passed, so existing call sites
 * keep working and there is an escape hatch for the rare query that must NOT
 * join the ambient transaction — an audit row that should survive a rollback,
 * say.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

const transactionStorage = new AsyncLocalStorage<EntityManager>();

/** The ambient transactional manager, or undefined outside `@Transactional()`. */
export function getTransactionManager(): EntityManager | undefined {
  return transactionStorage.getStore();
}

/** Runs `fn` with `entityManager` as the ambient transactional manager. */
export function runInTransaction<T>(
  entityManager: EntityManager,
  fn: () => T,
): T {
  return transactionStorage.run(entityManager, fn);
}

/**
 * Fallback DataSource for `@Transactional()` on classes that hold no repository
 * of their own — a service composed only of other services, say. Registered by
 * DatabaseModule; there is exactly one per process.
 */
let registeredDataSource: DataSource | undefined;

export function registerDataSource(dataSource: DataSource): void {
  registeredDataSource = dataSource;
}

type ManagerHolder = {
  dataSource?: { manager?: EntityManager };
  repository?: { manager?: EntityManager };
};

function resolveManager(self: unknown): EntityManager {
  // Prefer something on the instance so a class that injects DataSource or a
  // Repository is self-contained and testable without touching module state.
  const holder = self as ManagerHolder;
  const own = holder?.dataSource?.manager ?? holder?.repository?.manager;
  if (own) return own;
  if (registeredDataSource) return registeredDataSource.manager;
  throw new Error(
    '@Transactional() found no EntityManager. Inject DataSource as ' +
      '`dataSource` on the decorated class, or make sure DatabaseModule is ' +
      'imported so it can register the DataSource.',
  );
}

export interface TransactionalOptions {
  isolationLevel?: IsolationLevel;
}

/**
 * Runs the decorated async method inside a transaction.
 *
 * Nesting joins the outer transaction rather than opening a second one. TypeORM
 * would otherwise take a second connection from the pool and block on the locks
 * the outer transaction already holds.
 *
 * Belongs on service methods, not repository methods — a transaction is a
 * use-case boundary, and a single repository call is too small to own one.
 *
 * Keep network I/O out of the decorated method. A transaction pins a pool
 * connection for its whole life, so an SMTP or HTTP call inside one ties up
 * connections that unrelated requests then queue behind.
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
      if (getTransactionManager()) {
        // Already inside one — join it.
        return original.apply(this, args);
      }
      const manager = resolveManager(this);
      const run = (em: EntityManager) =>
        runInTransaction(em, () => original.apply(this, args));

      return options.isolationLevel
        ? manager.transaction(options.isolationLevel, run)
        : manager.transaction(run);
    };

    return descriptor;
  };
}
