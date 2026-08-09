import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccountRepository } from '../account/account.repository';
import { TypedConfigService } from 'src/common/typed-config/typed-config.service';
import { Status as AccountStatus } from '../account/enums/account-status.enum';

import { LoginDto } from './dtos/login.dto';
import { AuthException } from './exceptions/auth-exceptions.exceptions';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { AccountInfo } from 'src/interfaces/request';
import { Role } from '../account/enums/role.enum';
import { ResetPasswordTokenRepository } from '../reset-password-token/reset-password-token.repository';

import * as ejs from 'ejs';
import { VerifyResetPasswordTokenDto } from './dtos/verify-reset-password-token.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthJwtService } from './services/auth-jwt.service';
import { AuthEmailService } from './services/auth-email.service';
import { AuthTemplateService } from './services/auth-template.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly typedConfigService: TypedConfigService,

    private readonly accountRepository: AccountRepository,

    private readonly resetPasswordTokenRepository: ResetPasswordTokenRepository,

    private readonly authPasswordService: AuthPasswordService,

    private readonly authJwtService: AuthJwtService,

    private readonly authEmailService: AuthEmailService,

    private readonly authTemplateService: AuthTemplateService,
  ) {}

  async Login(loginDto: LoginDto) {
    const account = await this.accountRepository.FindByEmailWithCredentials(
      loginDto.email,
      false,
    );
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    if (account.status === AccountStatus.INACTIVE) {
      throw AuthException.ACCOUNT_INACTIVE;
    }

    await this.authPasswordService.comparePasswords(
      loginDto.password,
      account.passwordHash,
    );

    const payload = {
      sub: account.id,
      role: account.role,
    };

    const accessToken = await this.authJwtService.createAccessToken(payload);

    const refreshToken = await this.authJwtService.createRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  async Refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw AuthException.REFRESH_TOKEN_NOT_FOUND;
    }
    let returnedRefreshToken = refreshToken;

    const decoded = await this.authJwtService.verifyRefreshToken(refreshToken);

    const payload = {
      sub: decoded.sub,
      role: decoded.role,
    };

    const accessToken = await this.authJwtService.createAccessToken(payload);

    //check refresh token remaining time, if less than 7 day => refresh
    if (decoded.exp * 1000 - Date.now() < 7 * 24 * 60 * 60) {
      returnedRefreshToken =
        await this.authJwtService.createRefreshToken(payload);
    }

    return { accessToken, refreshToken: returnedRefreshToken };
  }

  async GetAccountInfo(id: string) {
    return this.accountRepository.FindById(id, false);
  }

  async UpdatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
    accountInfo?: AccountInfo,
  ): Promise<boolean> {
    await this.authPasswordService.isPasswordStrong(
      updatePasswordDto.newPassword,
    );
    return await this.accountRepository.Transaction(
      async (tx) => {
        const account = await this.accountRepository.FindByIdWithCredentials(
          id,
          false,
          tx,
        );

        if (!account) {
          throw AuthException.ACCOUNT_NOT_FOUND;
        }

        const isOwner = accountInfo?.sub === id;

        const isAdmin = accountInfo?.role === Role.ADMIN;
        if (!isOwner && !isAdmin) {
          throw AuthException.INSUFFICIENT_PERMISSION;
        }

        if (!isAdmin) {
          await this.authPasswordService.comparePasswords(
            updatePasswordDto.currentPassword,
            account.passwordHash,
          );
        }

        if ((account.status = AccountStatus.NEED_CHANGE_PASSWORD)) {
          account.status = AccountStatus.ACTIVE;
        }

        const { salt, hash } = await this.authPasswordService.hashPassword(
          updatePasswordDto.newPassword,
        );

        return (
          this.accountRepository.Update(
            account.id,
            {
              passwordSalt: salt,
              passwordHash: hash,
              status: AccountStatus.ACTIVE,
            },
            tx,
          ) != null
        );
      },
    );
  }

  async ResetPassword(email: string): Promise<void> {
    return await this.accountRepository.Transaction(
      async (tx) => {
        const account = await this.accountRepository.FindByEmail(
          email,
          false,
          tx,
        );
        if (!account) {
          throw AuthException.ACCOUNT_NOT_FOUND;
        }

        const payload = {
          sub: account.id,
        };

        const resetToken =
          await this.authJwtService.createResetPasswordToken(payload);

        const hash = await this.authPasswordService.hashToken(resetToken);

        const resetPasswordTokenData: Prisma.ResetPasswordTokenCreateInput = {
          account: { connect: { id: account.id } },
          tokenHash: hash,
          expiresAt: new Date(
            Date.now() +
              this.authJwtService.parseExpiresIn(
                this.typedConfigService.jwt.resetPasswordExpiresIn,
              ),
          ),
          usable: true,
        };

        await this.resetPasswordTokenRepository.BatchUpdate(
          { accountId: account.id, usable: true },
          { usable: false },
        );

        await this.resetPasswordTokenRepository.Create(
          resetPasswordTokenData,
          tx,
        );

        const template =
          await this.authTemplateService.getResetPasswordEmailTemplate();

        await this.authEmailService.sendResetPasswordEmail(
          email,
          template,
          resetToken,
        );
      },
    );
  }

  async GetResetPasswordForm(token: string): Promise<string> {
    if (!token) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    const decoded = await this.authJwtService.verifyResetPasswordToken(token);

    const resetPasswordTokens =
      await this.resetPasswordTokenRepository.FindActiveTokenByAccountId(
        decoded.sub,
      );

    if (!resetPasswordTokens) {
      throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
    }

    //no need to validate time because jwt verify already do that
    await this.authJwtService.compareResetTokenHash(
      token,
      resetPasswordTokens.tokenHash,
    );

    const account = await this.accountRepository.FindById(decoded.sub, false);
    if (!account) {
      throw AuthException.ACCOUNT_NOT_FOUND;
    }

    const template =
      await this.authTemplateService.getResetPasswordFormTemplate();
    const rendered = ejs.render(template, {
      token,
      clientUrl:
        this.typedConfigService.client.url1 ||
        this.typedConfigService.client.url2,
      err: null,
    });

    return rendered;
  }

  async VerifyResetPasswordToken(
    verifyResetPasswordTokenDto: VerifyResetPasswordTokenDto,
  ): Promise<boolean> {
    return await this.accountRepository.Transaction(
      async (tx) => {
        const { token, password, confirmPassword } =
          verifyResetPasswordTokenDto;

        if (password !== confirmPassword) {
          throw AuthException.PASSWORD_NOT_MATCH;
        }

        await this.authPasswordService.isPasswordStrong(password);

        if (!token) {
          throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
        }
        const decoded =
          await this.authJwtService.verifyResetPasswordToken(token);

        if (!decoded) {
          throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
        }

        const resetPasswordTokens =
          await this.resetPasswordTokenRepository.FindActiveTokenByAccountId(
            decoded.sub,
            tx,
          );

        if (!resetPasswordTokens) {
          throw AuthException.INVALID_RESET_PASSWORD_TOKEN;
        }

        //no need to validate time because jwt verify already do that
        await this.authJwtService.compareResetTokenHash(
          token,
          resetPasswordTokens.tokenHash,
        );

        const account = await this.accountRepository.FindById(
          decoded.sub,
          false,
        );
        if (!account) {
          throw AuthException.ACCOUNT_NOT_FOUND;
        }

        const { salt, hash } =
          await this.authPasswordService.hashPassword(password);

        await this.accountRepository.Update(
          account.id,
          { passwordSalt: salt, passwordHash: hash },
          tx,
        );

        //invalidate the used token
        const result = await this.resetPasswordTokenRepository.Update(
          resetPasswordTokens.id,
          { usable: false },
          tx,
        );
        return result != null;
      },
    );
  }
}
