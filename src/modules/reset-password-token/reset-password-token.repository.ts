import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { Prisma, ResetPasswordToken } from '@prisma/client';

@Injectable()
export class ResetPasswordTokenRepository extends BaseRepository {
  // Redeclared so Nest emits design:paramtypes on the concrete class.
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async Create(
    token: Prisma.ResetPasswordTokenCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordToken> {
    return this.db(tx).resetPasswordToken.create({ data: token });
  }

  async FindById(
    id: string,
    includeDeleted: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordToken | null> {
    return this.db(tx).resetPasswordToken.findFirst({
      where: includeDeleted ? { id } : { id, isDeleted: false },
    });
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
    id: string,
    data: Prisma.ResetPasswordTokenUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<ResetPasswordToken> {
    return this.db(tx).resetPasswordToken.update({
      where: { id },
      data,
    });
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
  ): Promise<ResetPasswordToken | null> {
    return this.db(tx).resetPasswordToken.findFirst({
      where: { accountId, usable: true, isDeleted: false },
    });
  }
}
