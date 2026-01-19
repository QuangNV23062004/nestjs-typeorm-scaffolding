import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!requiredRoles) return true;

    const request = ctx.switchToHttp().getRequest();
    const accountInfo = request?.accountInfo;
    if (!accountInfo?.role)
      throw new ForbiddenException('You do not have permission to access');

    const roles = Array.isArray(accountInfo.role)
      ? accountInfo.role
      : [accountInfo.role];
    if (roles.some((r) => requiredRoles.includes(r))) return true;

    throw new ForbiddenException('You do not have permission to access');
  }
}
