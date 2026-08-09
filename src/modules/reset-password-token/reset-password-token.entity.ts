import { BaseEntity } from 'src/common/entity/base.entity';

/** Mirrors the ResetPasswordToken model in reset-password-token.prisma. */
export class ResetPasswordTokenEntity extends BaseEntity {
  accountId: string;

  tokenHash: string;

  expiresAt: Date;

  usable: boolean;
}
