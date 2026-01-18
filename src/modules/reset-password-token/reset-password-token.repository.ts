import { InjectRepository } from '@nestjs/typeorm';
import { Condition, FindOptionsWhere, Repository } from 'typeorm';
import { ResetPasswordTokenEntity } from './reset-password-token.entity';
import { EntityManager } from 'typeorm';
import {
  WhereClause,
  WhereClauseCondition,
} from 'typeorm/query-builder/WhereClause';

export class ResetPasswordTokenRepository {
  constructor(
    @InjectRepository(ResetPasswordTokenEntity)
    private readonly resetPasswordTokenRepository: Repository<ResetPasswordTokenEntity>,
  ) {}

  async GetEntityManager() {
    return this.resetPasswordTokenRepository?.manager;
  }

  async GetRepository(entityManager?: EntityManager) {
    if (entityManager) {
      return entityManager.getRepository(ResetPasswordTokenEntity);
    }

    return this.resetPasswordTokenRepository;
  }

  async Create(
    token: ResetPasswordTokenEntity,
    entityManager?: EntityManager,
  ): Promise<ResetPasswordTokenEntity> {
    const repository = await this.GetRepository(entityManager);

    return repository.save(token);
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    entityManager?: EntityManager,
  ): Promise<ResetPasswordTokenEntity | null> {
    const repository = await this.GetRepository(entityManager);
    const where = { id: id };
    if (includeDeleted) {
      return repository.findOne({ where: where });
    }
    return repository.findOne({ where: { ...where, isDeleted: false } });
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

  async Restore(id: string, entityManager?: EntityManager): Promise<void> {
    const repository = await this.GetRepository(entityManager);
    await repository.update(id, { isDeleted: false });
  }

  async Update(
    token: ResetPasswordTokenEntity,
    entityManager?: EntityManager,
  ): Promise<ResetPasswordTokenEntity> {
    const repository = await this.GetRepository(entityManager);
    return repository.save(token);
  }

  async BatchUpdate(
    where: FindOptionsWhere<ResetPasswordTokenEntity>,
    updateData: Partial<ResetPasswordTokenEntity>,
    entityManager?: EntityManager,
  ): Promise<void> {
    const repository = await this.GetRepository(entityManager);
    await repository.update(where, updateData);
  }

  async FindActiveTokenByAccountId(
    accountId: string,
    entityManager?: EntityManager,
  ): Promise<ResetPasswordTokenEntity | null> {
    const repository = await this.GetRepository(entityManager);
    return repository.findOne({
      where: {
        accountId: accountId,
        usable: true,
        isDeleted: false,
      },
    });
  }
}
