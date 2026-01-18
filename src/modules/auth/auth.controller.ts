import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { Request, Response } from 'express';
import { extractRefreshToken } from 'src/common/utils/extract-token.utils';
import { Public } from 'src/decorators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IAuthenticatedRequest } from 'src/interfaces/request';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { VerifyResetPasswordTokenDto } from './dtos/verify-reset-password-token.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update Password',
    description: 'Update password for authenticated user',
  })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiParam({
    name: 'id',
    description: 'ID of the account to update password for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('update-password/:id')
  async UpdatePassword(
    @Param('id') id: string,
    @Req() request: IAuthenticatedRequest,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.UpdatePassword(
      id,
      updatePasswordDto,
      request?.accountInfo,
    );
  }

  @Public()
  @ApiOperation({
    summary: 'Reset Password',
    description: 'Reset password for authenticated user',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Verification email has been sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch('reset-password')
  async ResetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    const resetTemplate = await this.authService.ResetPassword(
      resetPasswordDto.email,
    );
    res.send(resetTemplate);
  }

  @Public()
  @ApiOperation({
    summary: 'Verify Reset Password',
    description: 'Verify reset password for authenticated user',
  })
  @ApiBody({ type: VerifyResetPasswordTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Reset password verified successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('verify-reset-password')
  async VerifyResetPassword(
    @Body() verifyResetPasswordTokenDto: VerifyResetPasswordTokenDto,
  ) {
    const resetToken = await this.authService.VerifyResetPasswordToken(
      verifyResetPasswordTokenDto,
    );
    return { resetToken };
  }

  //could be handle in frontend if wanted
  @Public()
  @ApiOperation({
    summary: 'Get Reset Password Form',
    description: 'Get reset password form for authenticated user',
  })
  @ApiParam({
    name: 'token',
    description: 'Token to verify reset password for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset password form',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('reset-password/:token')
  async GetResetPasswordForm(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const resetTemplate = await this.authService.GetResetPasswordForm(token);
    return res.send(resetTemplate);
  }
}
