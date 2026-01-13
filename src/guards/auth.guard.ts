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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private typedConfigService: TypedConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token = extractAccessToken(request);
    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        publicKey: this.typedConfigService.jwt.publicAccessKey,
      });

      request.user = payload;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
