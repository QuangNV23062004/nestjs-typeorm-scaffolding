import { BaseEntity } from 'src/common/entity/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('reset_password_tokens')
export class ResetPasswordTokenEntity extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'usable', type: 'boolean', default: false })
  usable: boolean;
}
