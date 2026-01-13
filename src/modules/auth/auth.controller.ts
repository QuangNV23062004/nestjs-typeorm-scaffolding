import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { Request } from 'express';
import { extractRefreshToken } from 'src/common/utils/extract-token.utils';
import { Public } from 'src/decorators';

@Controller('auth')
export class AuthController {
  constructor(@Inject() private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async Login(@Body() loginDto: LoginDto) {
    return this.authService.Login(loginDto);
  }

  @Public()
  @Post('refresh')
  async Refresh(@Req() request: Request) {
    const refreshToken = extractRefreshToken(request);
    return this.authService.Refresh(refreshToken);
  }
}
