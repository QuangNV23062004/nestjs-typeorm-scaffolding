import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/common/database/prisma.service';
import { Prisma } from 'src/generated/prisma';
import { ResetPasswordTokenEntity } from './reset-password-token.entity';

@Injectable()
export class ResetPasswordTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Prisma.TransactionClient) {
    return tx ?? this.prisma;
  }

  private toEntity(row: unknown): ResetPasswordTokenEntity {
    return plainToInstance(ResetPasswordTokenEntity, row);
  }

  async Transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async Create(
    token: Partial<ResetPasswordTokenEntity>,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordTokenEntity> {
    const created = await this.db(tx).resetPasswordToken.create({
      data: {
        accountId: token.accountId as string,
        tokenHash: token.tokenHash as string,
        expiresAt: token.expiresAt as Date,
        ...(token.usable !== undefined ? { usable: token.usable } : {}),
      },
    });
    return this.toEntity(created);
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordTokenEntity | null> {
    const row = await this.db(tx).resetPasswordToken.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
    return row ? this.toEntity(row) : null;
  }

  async SoftDelete(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const result = await this.db(tx).resetPasswordToken.updateMany({
      where: { id },
      data: { isDeleted: true },
    });
    return result.count > 0;
  }

  async HardDelete(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const result = await this.db(tx).resetPasswordToken.deleteMany({
      where: { id },
    });
    return result.count > 0;
  }

  async Restore(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.db(tx).resetPasswordToken.updateMany({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async Update(
    token: ResetPasswordTokenEntity,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordTokenEntity> {
    const updated = await this.db(tx).resetPasswordToken.update({
      where: { id: token.id },
      data: {
        accountId: token.accountId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        usable: token.usable,
        isDeleted: token.isDeleted,
      },
    });
    return this.toEntity(updated);
  }

  async BatchUpdate(
    where: Prisma.ResetPasswordTokenWhereInput,
    updateData: Prisma.ResetPasswordTokenUpdateManyMutationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.db(tx).resetPasswordToken.updateMany({
      where,
      data: updateData,
    });
  }

  async FindActiveTokenByAccountId(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordTokenEntity | null> {
    const row = await this.db(tx).resetPasswordToken.findFirst({
      where: { accountId, usable: true, isDeleted: false },
    });
    return row ? this.toEntity(row) : null;
  }
}
