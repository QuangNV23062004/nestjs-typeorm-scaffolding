import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TypedConfigService } from 'src/common/typed-config/typed-config.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';
import { extractAccessToken } from 'src/common/utils/extract-token.utils';
import { AuthJwtService } from 'src/modules/auth/services/auth-jwt.service';
import { getRequest } from 'src/common/context/execution-context.util';
import { getRequestContext } from 'src/common/context/request.context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authJwtService: AuthJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request = getRequest(context);
    if (!request) {
      throw new UnauthorizedException('No request context available');
    }
    const token = extractAccessToken(request);
    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      const payload = await this.authJwtService.verifyAccessToken(token);

      request.accountInfo = payload;

      // Enrich the request context so every log line after this point — and the
      // error_logs rows — carry the account id without extra plumbing.
      const ctx = getRequestContext();
      if (ctx) ctx.accountId = payload?.sub ?? payload?.id;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
