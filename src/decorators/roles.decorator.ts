import { SetMetadata, BadRequestException } from '@nestjs/common';
import { Role } from 'src/modules/account/enums/role.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => {
  const allRoles = Object.values(Role);

  const invalidRoles = roles.filter((role) => !allRoles.includes(role));
  if (invalidRoles.length > 0) {
    throw new BadRequestException(
      `Invalid role(s): ${invalidRoles.join(', ')}`,
    );
  }

  return SetMetadata(ROLES_KEY, roles);
};
