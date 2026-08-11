/**
 * Shared plumbing for every repository: manager resolution and transactions.
 *
 * Model-specific logic stays in the subclass. Filter building in particular is
 * not inherited — the criteria differ per entity, and a shared version would be
 * either loosely typed or grow a flag per caller.
 *
 * Subclasses must redeclare the constructor and call `super(repository)`. Nest
 * reads `design:paramtypes` off the concrete class, and a class with no
 * constructor of its own emits none, so DI would inject nothing. The
 * `@InjectRepository(Entity)` decorator also has to sit on the concrete
 * constructor, since the entity differs per subclass.
 */
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { getTransactionManager, runInTransaction } from './transaction.context';

export abstract class BaseRepository<TEntity extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<TEntity>) {}

  /**
   * Repository bound to the right manager, in precedence order:
   *   1. `entityManager` passed explicitly by the caller
   *   2. the ambient manager opened by `@Transactional()`
   *   3. the injected repository
   *
   * Explicit first so a caller can still force a query onto the base connection
   * (or a different transaction) while inside an ambient one.
   */
  protected async GetRepository(
    entityManager?: EntityManager,
  ): Promise<Repository<TEntity>> {
    const manager = entityManager ?? getTransactionManager();
    // `repository.target` carries the entity class, so subclasses do not have
    // to pass it in a second time alongside the repository itself.
    return manager
      ? manager.getRepository<TEntity>(this.repository.target)
      : this.repository;
  }

  /** The ambient manager if one is open, otherwise the base manager. */
  async GetEntityManager(): Promise<EntityManager> {
    return getTransactionManager() ?? this.repository.manager;
  }

  /**
   * Runs `fn` inside a transaction, joining an ambient one if present.
   *
   * The manager is also published to AsyncLocalStorage, so repository calls
   * inside `fn` join it without being passed one — though `fn` still receives
   * it for call sites that prefer to be explicit.
   */
  async Transaction<T>(fn: (em: EntityManager) => Promise<T>): Promise<T> {
    const ambient = getTransactionManager();
    if (ambient) return fn(ambient);

    return this.repository.manager.transaction((em) =>
      runInTransaction(em, () => fn(em)),
    );
  }
}
