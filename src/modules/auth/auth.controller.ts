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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject() private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate user by email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Public()
  @Post('login')
  async Login(@Body() loginDto: LoginDto) {
    return this.authService.Login(loginDto);
  }

  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Refresh access token using refresh token',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Public()
  @Post('refresh')
  async Refresh(@Req() request: Request) {
    const refreshToken = extractRefreshToken(request);
    return this.authService.Refresh(refreshToken);
  }
}
