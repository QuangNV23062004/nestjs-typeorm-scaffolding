import { InjectRepository } from '@nestjs/typeorm';
import { AccountEntity } from './account.entity';
import { Repository } from 'typeorm/repository/Repository';
import { WhereClause } from 'typeorm/query-builder/WhereClause';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { FilterAccountDto } from './dtos/filter-account.dto';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { PaginationResultDto } from 'src/common/pagination/pagination-result.dto';
import { Role } from './enums/role.enum';

export class AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async GetEntityManager() {
    return this.accountRepository.manager;
  }

  async GetRepository(entityManager?: EntityManager) {
    if (entityManager) {
      return entityManager.getRepository(AccountEntity);
    }

    return this.accountRepository;
  }

  async Create(
    account: AccountEntity,
    entityManager?: EntityManager,
  ): Promise<AccountEntity> {
    const repository = await this.GetRepository(entityManager);
    return repository.save(account);
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    entityManager?: EntityManager,
  ): Promise<AccountEntity | null> {
    const repository = await this.GetRepository(entityManager);
    const where: FindOptionsWhere<AccountEntity> = { id: id };
    if (!includeDeleted) {
      return repository.findOne({
        where: { ...where, isDeleted: false },
      });
    }

    return repository.findOne({ where: where });
  }

  //ignore page & limit
  async FindAll(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    entityManager?: EntityManager,
  ): Promise<AccountEntity[]> {
    const repository = await this.GetRepository(entityManager);

    const qb = repository
      .createQueryBuilder('account')
      .where('account.id != :excludeId', { excludeId })
      .andWhere('account.role IN (:...role)', { role });

    if (query?.search && query?.searchBy) {
      const searchField = `account.${query.searchBy}`;
      qb.andWhere(`${searchField} ILIKE :search`, {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query?.orderBy && query?.order) {
      const orderField = `account.${query.orderBy}`;
      qb.orderBy(orderField, query.order as 'ASC' | 'DESC');
    }
    if (!includeDeleted) {
      qb.andWhere('account.isDeleted = :isDeleted', { isDeleted: false });
    }

    return qb.getMany();
  }

  async FindPaginated(
    includeDeleted: boolean,
    excludeId: string,
    role: Role[],
    query?: FilterAccountDto,
    entityManager?: EntityManager,
  ): Promise<PaginationResultDto<AccountEntity>> {
    const repository = await this.GetRepository(entityManager);

    const qb = repository
      .createQueryBuilder('account')
      .where('account.id != :excludeId', { excludeId })
      .andWhere('account.role IN (:...role)', { role });

    if (query?.search && query?.searchBy) {
      const searchField = `account.${query.searchBy}`;
      qb.andWhere(`${searchField} ILIKE :search`, {
        search: `%${query.search.trim()}%`,
      });
    }
    if (query?.orderBy && query?.order) {
      const orderField = `account.${query.orderBy}`;
      qb.orderBy(orderField, query.order as 'ASC' | 'DESC');
    }

    if (!includeDeleted) {
      qb.andWhere('account.isDeleted = :isDeleted', { isDeleted: false });
    }

    const totalItems = await qb.getCount();

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const offset = (page - 1) * limit;

    const items = await qb.skip(offset).take(limit).getMany();

    return new PaginationResultDto<AccountEntity>(
      items,
      Math.ceil(totalItems / limit),
      page,
      limit,
      query?.search || '',
      query?.searchBy || '',
      query?.order || '',
      query?.orderBy || '',
      page < Math.ceil(totalItems / limit),
      page > 1,
    );
  }

  async FindByEmail(
    email: string,
    includeDeleted: boolean,
    entityManager?: EntityManager,
  ): Promise<AccountEntity | null> {
    const repository = await this.GetRepository(entityManager);
    const where: FindOptionsWhere<AccountEntity> = { email: email };
    if (!includeDeleted) {
      return repository.findOne({
        where: { ...where, isDeleted: false },
      });
    }

    return repository.findOne({ where: where });
  }

  async Update(
    account: AccountEntity,
    entityManager?: EntityManager,
  ): Promise<AccountEntity> {
    const repository = await this.GetRepository(entityManager);
    return repository.save(account);
  }

  async SoftDelete(
    id: string,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const repository = await this.GetRepository(entityManager);
    const result = await repository.update(id, { isDeleted: true });
    return (result?.affected as number) > 0;
  }

  async HardDelete(
    id: string,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const repository = await this.GetRepository(entityManager);
    const result = await repository.delete(id);
    return (result?.affected as number) > 0;
  }

  async Restore(id: string, entityManager?: EntityManager): Promise<boolean> {
    const repository = await this.GetRepository(entityManager);
    const result = await repository.update(id, { isDeleted: false });
    return (result?.affected as number) > 0;
  }
}
