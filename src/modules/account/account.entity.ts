import { BaseEntity } from 'src/common/entity/base.entity';
import { Exclude } from 'class-transformer';

/**
 * Domain/serialization type for `accounts`. Mirrors the Account model in
 * account.prisma. @Exclude() keeps the credential columns out of API responses
 * — which only works on class instances, so repositories hydrate rather than
 * returning Prisma's plain objects directly.
 */
export class AccountEntity extends BaseEntity {
  username: string;

  email: string;

  // toPlainOnly: strip from API responses, but still hydrate from the DB —
  // auth compares against passwordHash. A bare @Exclude() drops the field in
  // BOTH directions, which silently breaks login.
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Exclude({ toPlainOnly: true })
  passwordSalt: string;

  role: string;

  status: string;
}
